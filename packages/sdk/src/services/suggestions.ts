import { Suggestion } from "../types/suggestion";
import { getBaseApiUrl } from "./base";

export const loadSuggestions = async (
  apiKey: string,
  locale: string,
  productId: string,
): Promise<Suggestion> => {
  const pagePath = window.location.pathname.split("?")[0];

  const baseApiUrl = getBaseApiUrl();
  const response = await fetch(
    `${baseApiUrl}/ai/product-questions?pagePath=${pagePath}&locale=${locale}&productId=${
      productId
    }`,
    {
      headers: {
        Authorization: apiKey,
      },
    },
  );
  const data = await response.json();

  return data as Suggestion;
};
