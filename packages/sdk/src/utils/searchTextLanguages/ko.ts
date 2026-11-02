import type { TextsFactory } from "./types";

export const ko: TextsFactory = (n) => ({
  searching: (query) => `“${query}” 검색 중…`,
  noResults: "일치하는 상품이 없습니다",
  retry: "다시 시도",
  collectionsLabel: "컬렉션",
  productsLabel: "상품",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "전체 상품"
      : {
          best_sellers: "베스트셀러",
          newest: "신상품",
          price_asc: "낮은 가격",
          price_desc: "높은 가격",
        }[ranking],
  collectionsCount: (count) => `컬렉션 ${n(count)}개`,
  resultsCount: (count) => `검색 결과 ${n(count)}개`,
  seeAllLabel: (count) => `검색 결과 ${n(count)}개 모두 보기`,
  previous: "이전",
  next: "다음",
  pageOf: (page, pages) => `${n(page)} / ${n(pages)} 페이지`,
  filterFields: {
    price: "가격",
    brand: "브랜드",
    category: "카테고리",
    productType: "상품 유형",
    color: "색상",
    size: "크기",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field}: ${value} 미만`,
      "<=": `${field}: ${value} 이하`,
      "=": `${field}: ${value}`,
      "!=": `${field}: ${value} 이외`,
      ">=": `${field}: ${value} 이상`,
      ">": `${field}: ${value} 초과`,
    })[operator],
  filterBetween: (field, min, max) => `${field}: ${min}부터 ${max}까지`,
  filterExclusion: (field, value) => `${field}: ${value} 제외`,
  filterValueRange: (min, max) => `${min} – ${max}`,
});
