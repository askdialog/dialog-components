export const config = {
  // Nest monolith (production) — serves POST /public/search/lexical and
  // GET /public/product-page-questions. Custom domain, same as the dashboard's
  // VITE_MONOLITH_API_URL: the raw execute-api gateway URL answers 500 on
  // every route and must not be used.
  monolithApiUrl: "https://api.askdialog.ai",
  assistantUrl: "https://d2zm7i5bmzo6ze.cloudfront.net/assets/index.js",
};
export type Config = typeof config;
