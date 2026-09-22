// Template for the gitignored config.local.ts: copy this file to config.local.ts, adjust
// the values, then activate it with `pnpm set-config local` (restore with
// `pnpm set-config production`).
export const config = {
  // Local Nest monolith — serves POST /public/search and
  // GET /public/product-page-questions. Match your monolith port
  // (per-developer; see backend/monolith/.env PORT in dialog-ecom).
  monolithApiUrl: "http://localhost:3001",
  assistantUrl: "https://d2bycosa71tnxv.cloudfront.net/assets/index.js",
};
export type Config = typeof config;
