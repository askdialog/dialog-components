import { SearchAiMoney, SearchAiProductHit } from "../types/search";
import { formatAmount } from "../utils/searchPrice";
import { resolveDisplayUrl, safeHref } from "../utils/searchDisplay";
import { ProductHitDisplay } from "./connectHits";
import { SearchController } from "./types";

const formatMoney = (
  money: SearchAiMoney | undefined,
  locale: string,
): string =>
  formatAmount(
    money?.amount === undefined ? undefined : Number(money.amount),
    money?.currencyCode,
    locale,
  );

const priceRangeText = (
  { min, max }: NonNullable<SearchAiProductHit["priceRange"]>,
  locale: string,
): string => {
  const low = formatMoney(min, locale);
  const high = formatMoney(max, locale);

  if (low === "" || high === low) {
    return high;
  }

  return high === "" ? low : `${low} – ${high}`;
};

// Its `url`, else Shopify's product path from its handle; an empty one is missing.
const recordPath = ({
  url,
  handle,
}: SearchAiProductHit): string | undefined => {
  if (url !== undefined && url !== "") {
    return url;
  }

  return handle === undefined || handle === ""
    ? undefined
    : `products/${encodeURIComponent(handle)}`;
};

/**
 * The display of an AI search hit, built from its raw record: its title, image,
 * price range in the shopper's language, and its storefront link, `url` when the
 * record has one, else Shopify's `products/<handle>` under `storefrontRoot`.
 */
export const aiHitDisplay = (
  controller: SearchController,
  record: SearchAiProductHit,
): ProductHitDisplay => {
  const { language, storefrontRoot } = controller.getSnapshot().context;
  const title = record.title ?? "";
  const href = resolveDisplayUrl(recordPath(record), storefrontRoot);
  const image = safeHref(record.imageUrl);

  return {
    title,
    titleParts: [{ text: title, highlighted: false }],
    href,
    image: image === undefined ? undefined : { url: image, shape: "theme" },
    price:
      record.priceRange === undefined
        ? ""
        : priceRangeText(record.priceRange, language),
    compareAtPrice: "",
  };
};
