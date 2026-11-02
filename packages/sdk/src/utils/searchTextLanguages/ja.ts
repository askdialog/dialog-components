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
});
