import { useEffect, useRef } from 'react';

const R2_PUBLIC_URL = 'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev';
const VIDEO_SRC = `${R2_PUBLIC_URL}/site-media/splash/transformation.mp4`;
const POSTER_SRC = `${R2_PUBLIC_URL}/site-media/splash/transformation-poster.jpg`;

interface SplashVideoProps {
  show: boolean;
  fadingOut: boolean;
  onDismiss: () => void;
  fallbackTimeoutMs: number;
}

export default function SplashVideo({ show, fadingOut, onDismiss, fallbackTimeoutMs }: SplashVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!show) return;
    const video = videoRef.current;
    let timer = setTimeout(onDismiss, fallbackTimeoutMs);

    // Once we know the clip's real length, replace the generic fallback with
    // one keyed to it — otherwise a static guess can fire before 'ended'
    // does and cut the video short (what happened with the original 8s value
    // against this ~15s clip).
    const onLoadedMetadata = () => {
      if (video && Number.isFinite(video.duration)) {
        clearTimeout(timer);
        timer = setTimeout(onDismiss, video.duration * 1000 + 3000);
      }
    };

    video?.addEventListener('loadedmetadata', onLoadedMetadata);
    video?.addEventListener('ended', onDismiss);
    video?.addEventListener('error', onDismiss);

    return () => {
      clearTimeout(timer);
      video?.removeEventListener('loadedmetadata', onLoadedMetadata);
      video?.removeEventListener('ended', onDismiss);
      video?.removeEventListener('error', onDismiss);
    };
  }, [show, onDismiss, fallbackTimeoutMs]);

  // Lock scroll while the splash is up — the video box below is positioned
  // fixed at the same offset the real banner sits at (right under the fixed
  // header, via the same --header-height var), which only stays aligned
  // with the real banner if the page can't scroll out from under it.
  useEffect(() => {
    if (!show) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [show]);

  if (!show) return null;

  const fadeClass = `transition-opacity duration-500 ${fadingOut ? 'opacity-0' : 'opacity-100'}`;

  return (
    <>
      {/* Blurs the real site (already rendered underneath) rather than
          hiding it — everything outside the banner-sized box below reads
          as "the site, softened" instead of a blank curtain. */}
      <div className={`fixed inset-0 z-[99] bg-black/40 backdrop-blur-2xl ${fadeClass}`} />

      {/* Same position/size as BannerCarousel's own box (.banner-box's
          16:9 ratio, the mx-auto w-full max-w-[1920px] wrapper, and the
          --header-height offset Header.tsx keeps in sync) so the video
          reads as "the banner, playing" rather than an unrelated overlay. */}
      <div
        className={`banner-box fixed inset-x-0 z-[100] mx-auto w-full max-w-[1920px] overflow-hidden bg-[#0b0d0b] shadow-2xl ${fadeClass}`}
        style={{ top: 'var(--header-height, 4rem)' }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay
          muted
          playsInline
        />
      </div>
    </>
  );
}
