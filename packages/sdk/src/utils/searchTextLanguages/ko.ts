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
  seeMore: (count) => `더 보기 (${n(count)})`,
  seeLess: "접기",
  clearAll: "모두 지우기",
  clearFilters: "필터 지우기",
  filteredEmptyTitle: "이 필터에 해당하는 결과가 없습니다",
  filteredEmptyBody: "필터를 일부 해제하면 더 많은 상품을 볼 수 있습니다.",
  priceMin: "최소",
  priceMax: "최대",
  priceMinAboveMax: "최소 가격은 최대 가격보다 클 수 없습니다.",
  removeFilter: (text) => `필터 삭제: ${text}`,
  filtersLabel: "필터",
  appliedFiltersLabel: "적용된 필터",
  sortLabel: "정렬",
  sortOptions: {
    relevance: "관련도순",
    price_asc: "낮은 가격순",
    price_desc: "높은 가격순",
  },
});
