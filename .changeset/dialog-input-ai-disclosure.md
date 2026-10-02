---
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

`DialogInput` now tells the shopper they are talking to an AI before they type: its placeholder is the fixed text "Ask the AI a question", and an AI disclosure line sits under the input. Both are in English, French or Spanish depending on the client `locale`, English otherwise.

The `placeholder` prop is deprecated and ignored. It stays accepted so existing code keeps compiling; remove it at your convenience.
