import { Sparkles, Clock, Heart, MapPin, type LucideIcon } from 'lucide-react';
import type { AboutValue } from '@/lib/aboutContent';
import { getYearsOfExperience } from '@/lib/experience';

const valueIconMap: Record<string, LucideIcon> = { Sparkles, Clock, Heart, MapPin };

type Props = {
  values: AboutValue[];
  lang: 'bg' | 'en';
};

// Shared between AboutPage and HomePage — same content.valuesList. A title
// containing the literal token "{years}" gets it replaced with the live
// years-of-experience count so the copy never needs a manual yearly edit.
export default function ValueProps({ values, lang }: Props) {
  const bg = lang === 'bg';
  const years = String(getYearsOfExperience());
  const items = values.map((v) => ({
    icon: valueIconMap[v.icon] ?? Sparkles,
    title: (bg ? v.titleBg : v.titleEn).replace('{years}', years),
    text: bg ? v.bodyBg : v.bodyEn,
  }));

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((v) => (
        <div key={v.title} className="glass glass-hover rounded-2xl p-6">
          <div className="mb-4 inline-flex rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-gold-300">
            <v.icon size={24} />
          </div>
          <h4 className="font-display text-lg font-semibold text-gray-100">{v.title}</h4>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">{v.text}</p>
        </div>
      ))}
    </div>
  );
}
