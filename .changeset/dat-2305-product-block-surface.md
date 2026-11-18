---
"@askdialog/dialog-react": patch
"@askdialog/dialog-vue": patch
---

The React and Vue product blocks send their product question events (`dialog_product_question_viewed`, `dialog_product_question_clicked`) with `surface: 'product_block'` instead of `'sdk_block'`: they show the same product block as the other integrations. `entry_point` stays `'pdp_block'`.
