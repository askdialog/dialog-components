---
"@askdialog/dialog-react": patch
"@askdialog/dialog-vue": patch
---

Product block: a question typed in the input is no longer sent as a suggested question (DEC-4215). `DialogInput` sent `fromQuestionSuggestion: true` for every typed question, so the assistant answered it as a cached suggestion: from the page product alone, without the conversation, and counted it as a suggestion click. A typed question is now sent without the flag; a clicked suggestion still sends it.
