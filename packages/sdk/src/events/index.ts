// Dialog's own events, one file each, exported by the SDK root and by its
// `@askdialog/dialog-sdk/events` alias, which loads nothing else.
export {
  PRODUCT_QUESTION_CLICKED,
  trackProductQuestionClicked,
  type ProductQuestionClickedProperties,
} from "./productQuestionClicked";
export {
  PRODUCT_QUESTION_VIEWED,
  trackProductQuestionViewed,
  type ProductQuestionViewedProperties,
} from "./productQuestionViewed";
