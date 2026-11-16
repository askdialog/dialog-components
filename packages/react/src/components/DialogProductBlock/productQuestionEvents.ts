export const PRODUCT_QUESTION_VIEWED = "dialog_product_question_viewed";
export const PRODUCT_QUESTION_CLICKED = "dialog_product_question_clicked";

/** The properties of a product question's view or click in the block. */
export const productQuestionEventProperties = (
  productQuestionId: string,
  productId: string,
  locale: string,
  index: number,
) => ({
  product_question_id: productQuestionId,
  product_id: productId,
  locale,
  position: index + 1,
  entry_point: "pdp_block",
  surface: "sdk_block",
});
