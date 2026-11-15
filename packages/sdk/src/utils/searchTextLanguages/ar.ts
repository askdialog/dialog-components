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
  filterFields: {
    price: "السعر",
    brand: "العلامة التجارية",
    category: "الفئة",
    productType: "نوع المنتج",
    color: "اللون",
    size: "المقاس",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field} أقل من ${value}`,
      "<=": `${field} حتى ${value} شاملًا`,
      "=": `${field}: ${value}`,
      "!=": `${field} بخلاف ${value}`,
      ">=": `${field} بدءًا من ${value}`,
      ">": `${field} أكثر من ${value}`,
    })[operator],
  filterBetween: (field, min, max) => `${field} بين ${min} و${max}`,
  filterExclusion: (field, value) => `${field}: باستثناء ${value}`,
  filterValueRange: (min, max) => `${min} – ${max}`,
  seeMore: (count) => `عرض المزيد (${n(count)})`,
  seeLess: "عرض أقل",
  clearAll: "مسح الكل",
  clearFilters: "مسح الفلاتر",
  filteredEmptyTitle: "لا نتائج مع هذه الفلاتر",
  filteredEmptyBody: "أزل بعض الفلاتر لعرض المزيد من المنتجات.",
  priceMin: "الحد الأدنى",
  priceMax: "الحد الأقصى",
  priceMinAboveMax: "يجب ألا يتجاوز السعر الأدنى السعر الأقصى.",
  removeFilter: (text) => `إزالة الفلتر: ${text}`,
  filtersLabel: "الفلاتر",
  appliedFiltersLabel: "الفلاتر المطبقة",
  sortLabel: "ترتيب حسب",
  sortOptions: {
    relevance: "الأكثر صلة",
    price_asc: "السعر: من الأقل إلى الأعلى",
    price_desc: "السعر: من الأعلى إلى الأقل",
  },
});
