type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  // Heading level. Stays h2 by default (this renders section headings all
  // over the site); pages whose main heading this is pass "h1" so the page
  // has exactly one top-level heading. Styling is identical either way.
  as?: 'h1' | 'h2';
};

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
  as: Heading = 'h2',
}: Props) {
  return (
    <div className={center ? 'text-center' : 'text-left'}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <Heading className="font-display text-2xl font-semibold text-gray-100 sm:text-3xl md:text-4xl">
        {title}
      </Heading>
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
