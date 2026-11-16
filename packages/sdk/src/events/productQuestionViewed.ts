import { trackDialogEvent } from "./dialogLayer";

export const PRODUCT_QUESTION_VIEWED = "dialog_product_question_viewed";

/** A product question at least 50 % visible for 1 continuous second, once per page display. */
export interface ProductQuestionViewedProperties {
  /** Null while the organization is on the legacy reader. */
  product_question_id: string | null;
  /** The store's product id (Shopify / platform), the GA4 `item_id`. */
  product_id: string;
  locale: string;
  /** 1-based, in the surface. */
  position: number;
  entry_point: string;
  surface: string;
  /** The `recommendationId` of the response that picked the question, null when none. */
  recommendation_id: string | null;
}

export const trackProductQuestionViewed = (
  properties: ProductQuestionViewedProperties,
): void => {
  trackDialogEvent(PRODUCT_QUESTION_VIEWED, properties);
};
