// Template for the gitignored config.local.ts: copy this file to config.local.ts, adjust
// the values, then activate it with `pnpm set-config local` (restore with
// `pnpm set-config production`).
export const config = {
  // Per-developer dev gateway — copy YOURS from frontend/app/.env VITE_API_URL in
  // dialog-ecom (the value below is one developer's, not a shared one).
  baseApiUrl: "https://REPLACE-ME.execute-api.eu-west-1.amazonaws.com",
  // Local Nest monolith — serves POST /public/search/lexical. Match your monolith port
  // (per-developer; see backend/monolith/.env PORT in dialog-ecom).
  monolithApiUrl: "http://localhost:3001",
  assistantUrl: "https://d2bycosa71tnxv.cloudfront.net/assets/index.js",
};
export type Config = typeof config;
