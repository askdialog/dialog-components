// Dialog's own events, exported by the SDK root and by its
// `@askdialog/dialog-sdk/events` alias, which loads nothing else.
// `trackDialogEvent` is the one call for every event; each event's name
// constant and properties type live in their own file under `definitions/`.
export { trackDialogEvent } from "./dialogLayer";
export {
  PRODUCT_QUESTION_CLICKED,
  type ProductQuestionClickedProperties,
} from "./definitions/productQuestionClicked";
export {
  PRODUCT_QUESTION_VIEWED,
  type ProductQuestionViewedProperties,
} from "./definitions/productQuestionViewed";
