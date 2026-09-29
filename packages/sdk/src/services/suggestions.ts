import { config } from "../config";
import { Suggestion } from "../types/suggestion";

const PRODUCT_QUESTIONS_PATH = "/public/product-page-questions";
const API_KEY_HEADER = "x-dialog-api-key";

export const loadSuggestions = async (
  apiKey: string,
  locale: string,
  productId: string,
): Promise<Suggestion> => {
  const pagePath = window.location.pathname.split("?")[0];
  const query = new URLSearchParams({ pagePath, locale, productId });

  const response = await fetch(
    `${config.monolithApiUrl}${PRODUCT_QUESTIONS_PATH}?${query.toString()}`,
    {
      headers: {
        [API_KEY_HEADER]: apiKey,
      },
    },
  );
  const data = await response.json();

  return data as Suggestion;
};
