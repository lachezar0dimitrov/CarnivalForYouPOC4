import { supabase } from '@/lib/supabase';

export type FaqItem = { qBg: string; qEn: string; aBg: string; aEn: string };
export type FaqGroup = { headingBg: string | null; headingEn: string | null; items: FaqItem[] };
export type TermsListItem = { bg: string; en: string };
export type InfoBlock = { titleBg: string; titleEn: string; items: TermsListItem[] };
export type TermsBlock = { titleBg: string; titleEn: string; items: TermsListItem[] };

export type TermsContent = {
  faqGroups: FaqGroup[];
  infoBlock: InfoBlock;
  termsBlocks: TermsBlock[];
};

type FaqItemRow = { q_bg: string; q_en: string; a_bg: string; a_en: string };
type FaqGroupRow = { heading_bg: string | null; heading_en: string | null; items: FaqItemRow[] };
type InfoBlockRow = { title_bg: string; title_en: string; items: TermsListItem[] };
type TermsBlockRow = { title_bg: string; title_en: string; items: TermsListItem[] };

type TermsContentRow = {
  faq_groups: FaqGroupRow[];
  info_block: InfoBlockRow;
  terms_blocks: TermsBlockRow[];
};

function mapRow(r: TermsContentRow): TermsContent {
  return {
    faqGroups: (r.faq_groups ?? []).map((g) => ({
      headingBg: g.heading_bg ?? null,
      headingEn: g.heading_en ?? null,
      items: (g.items ?? []).map((i) => ({ qBg: i.q_bg ?? '', qEn: i.q_en ?? '', aBg: i.a_bg ?? '', aEn: i.a_en ?? '' })),
    })),
    infoBlock: {
      titleBg: r.info_block?.title_bg ?? '',
      titleEn: r.info_block?.title_en ?? '',
      items: r.info_block?.items ?? [],
    },
    termsBlocks: (r.terms_blocks ?? []).map((b) => ({
      titleBg: b.title_bg ?? '',
      titleEn: b.title_en ?? '',
      items: b.items ?? [],
    })),
  };
}

export async function fetchTermsContent(): Promise<TermsContent | null> {
  const { data, error } = await supabase
    .from('terms_content')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as unknown as TermsContentRow);
}

export async function saveTermsContent(content: TermsContent): Promise<void> {
  const { error } = await supabase
    .from('terms_content')
    .update({
      faq_groups: content.faqGroups.map((g) => ({
        heading_bg: g.headingBg,
        heading_en: g.headingEn,
        items: g.items.map((i) => ({ q_bg: i.qBg, q_en: i.qEn, a_bg: i.aBg, a_en: i.aEn })),
      })),
      info_block: {
        title_bg: content.infoBlock.titleBg,
        title_en: content.infoBlock.titleEn,
        items: content.infoBlock.items,
      },
      terms_blocks: content.termsBlocks.map((b) => ({
        title_bg: b.titleBg,
        title_en: b.titleEn,
        items: b.items,
      })),
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) throw error;
}
