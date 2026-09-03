import { supabase } from '@/lib/supabase';

export type BilingualItem = { bg: string; en: string };
export type AboutValue = { icon: string; titleBg: string; titleEn: string; bodyBg: string; bodyEn: string };

export type AboutContent = {
  hookBodyBg: string;
  hookBodyEn: string;
  storyTitleBg: string;
  storyTitleEn: string;
  story1Bg: string;
  story1En: string;
  story2Bg: string;
  story2En: string;
  storyImageUrl: string;
  heroListTitleBg: string;
  heroListTitleEn: string;
  heroList: BilingualItem[];
  heroImageUrl: string;
  offerTitleBg: string;
  offerTitleEn: string;
  offerBodyBg: string;
  offerBodyEn: string;
  addonsBodyBg: string;
  addonsBodyEn: string;
  offerImageUrl: string;
  valuesList: AboutValue[];
  originTitleBg: string;
  originTitleEn: string;
  originBodyBg: string;
  originBodyEn: string;
  occasionsTitleBg: string;
  occasionsTitleEn: string;
  occasions: BilingualItem[];
  quoteBg: string;
  quoteEn: string;
  closingBodyBg: string;
  closingBodyEn: string;
  forestImageUrl: string;
};

type AboutValueRow = { icon: string; title_bg: string; title_en: string; body_bg: string; body_en: string };

type AboutContentRow = {
  hook_body_bg: string;
  hook_body_en: string;
  story_title_bg: string;
  story_title_en: string;
  story1_bg: string;
  story1_en: string;
  story2_bg: string;
  story2_en: string;
  story_image_url: string;
  hero_list_title_bg: string;
  hero_list_title_en: string;
  hero_list: BilingualItem[];
  hero_image_url: string;
  offer_title_bg: string;
  offer_title_en: string;
  offer_body_bg: string;
  offer_body_en: string;
  addons_body_bg: string;
  addons_body_en: string;
  offer_image_url: string;
  values_list: AboutValueRow[];
  origin_title_bg: string;
  origin_title_en: string;
  origin_body_bg: string;
  origin_body_en: string;
  occasions_title_bg: string;
  occasions_title_en: string;
  occasions: BilingualItem[];
  quote_bg: string;
  quote_en: string;
  closing_body_bg: string;
  closing_body_en: string;
  forest_image_url: string;
};

function mapRow(r: AboutContentRow): AboutContent {
  return {
    hookBodyBg: r.hook_body_bg ?? '',
    hookBodyEn: r.hook_body_en ?? '',
    storyTitleBg: r.story_title_bg ?? '',
    storyTitleEn: r.story_title_en ?? '',
    story1Bg: r.story1_bg ?? '',
    story1En: r.story1_en ?? '',
    story2Bg: r.story2_bg ?? '',
    story2En: r.story2_en ?? '',
    storyImageUrl: r.story_image_url ?? '',
    heroListTitleBg: r.hero_list_title_bg ?? '',
    heroListTitleEn: r.hero_list_title_en ?? '',
    heroList: r.hero_list ?? [],
    heroImageUrl: r.hero_image_url ?? '',
    offerTitleBg: r.offer_title_bg ?? '',
    offerTitleEn: r.offer_title_en ?? '',
    offerBodyBg: r.offer_body_bg ?? '',
    offerBodyEn: r.offer_body_en ?? '',
    addonsBodyBg: r.addons_body_bg ?? '',
    addonsBodyEn: r.addons_body_en ?? '',
    offerImageUrl: r.offer_image_url ?? '',
    valuesList: (r.values_list ?? []).map((v) => ({
      icon: v.icon ?? 'Sparkles',
      titleBg: v.title_bg ?? '',
      titleEn: v.title_en ?? '',
      bodyBg: v.body_bg ?? '',
      bodyEn: v.body_en ?? '',
    })),
    originTitleBg: r.origin_title_bg ?? '',
    originTitleEn: r.origin_title_en ?? '',
    originBodyBg: r.origin_body_bg ?? '',
    originBodyEn: r.origin_body_en ?? '',
    occasionsTitleBg: r.occasions_title_bg ?? '',
    occasionsTitleEn: r.occasions_title_en ?? '',
    occasions: r.occasions ?? [],
    quoteBg: r.quote_bg ?? '',
    quoteEn: r.quote_en ?? '',
    closingBodyBg: r.closing_body_bg ?? '',
    closingBodyEn: r.closing_body_en ?? '',
    forestImageUrl: r.forest_image_url ?? '',
  };
}

export async function fetchAboutContent(): Promise<AboutContent | null> {
  const { data, error } = await supabase
    .from('about_content')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as unknown as AboutContentRow);
}

export async function saveAboutContent(content: AboutContent): Promise<void> {
  const { error } = await supabase
    .from('about_content')
    .update({
      hook_body_bg: content.hookBodyBg,
      hook_body_en: content.hookBodyEn,
      story_title_bg: content.storyTitleBg,
      story_title_en: content.storyTitleEn,
      story1_bg: content.story1Bg,
      story1_en: content.story1En,
      story2_bg: content.story2Bg,
      story2_en: content.story2En,
      story_image_url: content.storyImageUrl,
      hero_list_title_bg: content.heroListTitleBg,
      hero_list_title_en: content.heroListTitleEn,
      hero_list: content.heroList,
      hero_image_url: content.heroImageUrl,
      offer_title_bg: content.offerTitleBg,
      offer_title_en: content.offerTitleEn,
      offer_body_bg: content.offerBodyBg,
      offer_body_en: content.offerBodyEn,
      addons_body_bg: content.addonsBodyBg,
      addons_body_en: content.addonsBodyEn,
      offer_image_url: content.offerImageUrl,
      values_list: content.valuesList.map((v) => ({
        icon: v.icon,
        title_bg: v.titleBg,
        title_en: v.titleEn,
        body_bg: v.bodyBg,
        body_en: v.bodyEn,
      })),
      origin_title_bg: content.originTitleBg,
      origin_title_en: content.originTitleEn,
      origin_body_bg: content.originBodyBg,
      origin_body_en: content.originBodyEn,
      occasions_title_bg: content.occasionsTitleBg,
      occasions_title_en: content.occasionsTitleEn,
      occasions: content.occasions,
      quote_bg: content.quoteBg,
      quote_en: content.quoteEn,
      closing_body_bg: content.closingBodyBg,
      closing_body_en: content.closingBodyEn,
      forest_image_url: content.forestImageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) throw error;
}
