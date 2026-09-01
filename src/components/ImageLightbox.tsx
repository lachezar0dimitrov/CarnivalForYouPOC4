import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Fullscreen click-to-zoom overlay. Opening pushes a history entry so the
// hardware/browser back gesture closes the lightbox instead of leaving the
// product page — closing always routes through history.back() (never a
// direct state update) so the X button, backdrop click and Escape all
// consume that same entry instead of leaving a phantom one behind that
// would otherwise eat the visitor's *next* back press for nothing.
export default function ImageLightbox({
  src,
  alt,
  onClosed,
}: {
  src: string;
  alt: string;
  onClosed: () => void;
}) {
  useEffect(() => {
    history.pushState({ lightbox: true }, '');

    const handlePopState = () => onClosed();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') history.back();
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Portaled to document.body — some ancestors (e.g. .product-photo-frame's
  // isolation: isolate) create their own stacking context, which would trap
  // a nested fixed z-index below unrelated siblings like the site header
  // regardless of how high that z-index is set.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
      onClick={() => history.back()}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          history.back();
        }}
        className="absolute right-4 top-4 z-10 rounded-full border border-gold-400/30 bg-black/60 p-2.5 text-gray-200 transition hover:border-gold-400/60 hover:text-gold-200"
        aria-label="Close"
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full select-none object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}
