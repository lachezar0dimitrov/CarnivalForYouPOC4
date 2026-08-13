type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
};

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
}: Props) {
  return (
    <div className={center ? 'text-center' : 'text-left'}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="font-display text-2xl font-semibold text-gray-100 sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {center && (
        <div className="mx-auto mt-4 h-px w-20 bg-gold-grad shadow-glow-sm" />
      )}
      {subtitle && (
        <p
          className={`mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base ${
            center ? 'mx-auto' : ''
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
