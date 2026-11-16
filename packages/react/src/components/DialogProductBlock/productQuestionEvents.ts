export const PRODUCT_QUESTION_VIEWED = "dialog_product_question_viewed";
export const PRODUCT_QUESTION_CLICKED = "dialog_product_question_clicked";

export interface ProductQuestionEventContext {
  /** The store's product id (Shopify / platform), the GA4 `item_id`. */
  productId: string;
  locale: string;
  recommendationId?: string | null;
}

/** The properties of a product question's view or click in the block. */
export const productQuestionEventProperties = (
  { productId, locale, recommendationId }: ProductQuestionEventContext,
  productQuestionId: string,
  index: number,
) => ({
  product_question_id: productQuestionId,
  product_id: productId,
  locale,
  position: index + 1,
  entry_point: "pdp_block",
  surface: "sdk_block",
  ...(recommendationId ? { recommendation_id: recommendationId } : {}),
});
