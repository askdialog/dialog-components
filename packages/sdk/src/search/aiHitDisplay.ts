import { SearchProductHit } from "../types/search";
import { formatAmount } from "../utils/searchPrice";
import { resolveDisplayUrl, safeHref } from "../utils/searchDisplay";
import { ProductHitDisplay } from "./connectHits";
import { SearchController } from "./types";

interface AiMoney {
  readonly amount?: string | number;
  readonly currencyCode?: string;
}

/** The fields an AI search hit carries in place of a lexical hit's `_display`. */
interface AiProductRecord {
  readonly title?: string;
  readonly handle?: string;
  readonly url?: string;
  readonly imageUrl?: string;
  readonly priceRange?: { readonly min?: AiMoney; readonly max?: AiMoney };
}

const formatMoney = (money: AiMoney | undefined, locale: string): string =>
  formatAmount(
    money?.amount === undefined ? undefined : Number(money.amount),
    money?.currencyCode,
    locale,
  );

const priceRangeText = (
  { min, max }: NonNullable<AiProductRecord["priceRange"]>,
  locale: string,
): string => {
  const low = formatMoney(min, locale);
  const high = formatMoney(max, locale);

  return high === "" || high === low ? low : `${low} – ${high}`;
};

/**
 * The display of an AI search hit, built from its raw record: its title, image,
 * price range in the shopper's language, and its storefront link, `url` when the
 * record has one, else Shopify's `products/<handle>` under `storefrontRoot`.
 */
export const aiHitDisplay = (
  controller: SearchController,
  hit: SearchProductHit,
): ProductHitDisplay => {
  const record = hit as unknown as AiProductRecord;
  const { language, storefrontRoot } = controller.getSnapshot().context;
  const title = record.title ?? "";
  const href =
    record.url === undefined
      ? record.handle === undefined || record.handle === ""
        ? undefined
        : resolveDisplayUrl(
            `products/${encodeURIComponent(record.handle)}`,
            storefrontRoot,
          )
      : resolveDisplayUrl(record.url, storefrontRoot);
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
