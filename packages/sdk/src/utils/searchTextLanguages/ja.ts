import type { TextsFactory } from "./types";

export const ja: TextsFactory = (n) => ({
  searching: (query) => `「${query}」を検索中…`,
  noResults: "一致する商品はありません",
  retry: "再試行",
  collectionsLabel: "コレクション",
  productsLabel: "商品",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "当店の商品"
      : {
          best_sellers: "売れ筋",
          newest: "新着",
          price_asc: "低価格",
          price_desc: "高価格",
        }[ranking],
  collectionsCount: (count) => `${n(count)}件のコレクション`,
  resultsCount: (count) => `${n(count)}件の結果`,
  seeAllLabel: (count) => `${n(count)}件の結果をすべて見る`,
  previous: "前へ",
  next: "次へ",
  pageOf: (page, pages) => `${n(page)} / ${n(pages)} ページ`,
  filterFields: {
    price: "価格",
    brand: "ブランド",
    category: "カテゴリー",
    productType: "商品タイプ",
    color: "色",
    size: "サイズ",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field}：${value}未満`,
      "<=": `${field}：${value}以下`,
      "=": `${field}：${value}`,
      "!=": `${field}：${value}以外`,
      ">=": `${field}：${value}以上`,
      ">": `${field}：${value}超`,
    })[operator],
  filterBetween: (field, min, max) => `${field}：${min}から${max}まで`,
  filterExclusion: (field, value) => `${field}：${value}を除く`,
  filterValueRange: (min, max) => `${min} – ${max}`,
  seeMore: (count) => `もっと見る（${n(count)}）`,
  seeLess: "表示を減らす",
  clearAll: "すべてクリア",
  clearFilters: "フィルターをクリア",
  filteredEmptyTitle: "このフィルターに一致する結果はありません",
  filteredEmptyBody: "フィルターを外すと、より多くの商品が表示されます。",
  priceMin: "最低",
  priceMax: "最高",
  priceMinAboveMax: "最低価格は最高価格以下にしてください。",
  removeFilter: (text) => `フィルターを削除：${text}`,
  filtersLabel: "フィルター",
  appliedFiltersLabel: "適用中のフィルター",
  sortLabel: "並び替え",
  sortOptions: {
    relevance: "関連度順",
    price_asc: "価格の安い順",
    price_desc: "価格の高い順",
  },
});
