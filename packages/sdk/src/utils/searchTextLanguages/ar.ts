import type { TextsFactory } from "./types";

export const ar: TextsFactory = (n, plural) => ({
  searching: (query) => `جارٍ البحث عن «${query}»…`,
  noResults: "لا توجد منتجات مطابقة",
  retry: "إعادة المحاولة",
  collectionsLabel: "المجموعات",
  productsLabel: "المنتجات",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "منتجاتنا"
      : {
          best_sellers: "الأكثر مبيعًا",
          newest: "وصل حديثًا",
          price_asc: "أسعار منخفضة",
          price_desc: "أسعار مرتفعة",
        }[ranking],
  collectionsCount: (count) =>
    plural(count, {
      zero: "لا مجموعات",
      one: "مجموعة واحدة",
      two: "مجموعتان",
      few: `${n(count)} مجموعات`,
      other: `${n(count)} مجموعة`,
    }),
  resultsCount: (count) =>
    plural(count, {
      zero: "لا نتائج",
      one: "نتيجة واحدة",
      two: "نتيجتان",
      few: `${n(count)} نتائج`,
      other: `${n(count)} نتيجة`,
    }),
  seeAllLabel: (count) =>
    plural(count, {
      one: "عرض النتيجة",
      other: `عرض كل النتائج (${n(count)})`,
    }),
  previous: "السابق",
  next: "التالي",
  pageOf: (page, pages) => `الصفحة ${n(page)} / ${n(pages)}`,
});
