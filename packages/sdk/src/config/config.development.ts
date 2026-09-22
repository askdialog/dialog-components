export const config = {
  // Nest monolith (staging) — serves POST /public/search and
  // GET /public/product-page-questions.
  monolithApiUrl: "https://api-staging.askdialog.ai",
  assistantUrl: "https://d2bycosa71tnxv.cloudfront.net/assets/index.js",
};
export type Config = typeof config;
