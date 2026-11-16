// Dialog's own events, one file each, exported by the SDK root and by its
// `@askdialog/dialog-sdk/events` alias, which loads nothing else.
export { trackDialogEvent } from "./dialogLayer";
export {
  PRODUCT_QUESTION_CLICKED,
  type ProductQuestionClickedProperties,
} from "./productQuestionClicked";
export {
  PRODUCT_QUESTION_VIEWED,
  type ProductQuestionViewedProperties,
} from "./productQuestionViewed";
