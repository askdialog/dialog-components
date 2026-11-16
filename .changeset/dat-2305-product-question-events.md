---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

Product question views and clicks (DAT-2305). `Suggestion["questions"]` items carry the question's `id`, null while the organization is on the legacy reader. `trackDialogEvent(event, properties)` pushes `{ ...properties, event }` onto `window.dialogLayer`, which the Dialog widget sends on. The React and Vue product blocks show the first 2 questions in the order the route returns them (the route draws them at random) and push `dialog_product_question_viewed` (at least 50 % visible for 1 continuous second, once per question and per page display, measured with `@askdialog/dialog-sdk/impressions`) and `dialog_product_question_clicked`, with `product_question_id`, `product_id`, `locale`, `position` (1-based), `entry_point: 'pdp_block'` and `surface: 'sdk_block'`. A question without an id sends nothing. A click still opens the assistant with the question. New SDK export: `trackDialogEvent`.
