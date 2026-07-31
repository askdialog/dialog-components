// Template for the gitignored config.local.ts: copy this file to config.local.ts, adjust
// the values, then activate it with `pnpm set-config local` (restore with
// `pnpm set-config production`).
export const config = {
  baseApiUrl: "https://abkjr5ukvi.execute-api.eu-west-1.amazonaws.com",
  // Local Nest monolith — serves POST /public/search. Match your monolith port
  // (per-developer; see backend/monolith/.env PORT in dialog-ecom).
  monolithApiUrl: "http://localhost:3001",
  assistantUrl: "https://d2bycosa71tnxv.cloudfront.net/assets/index.js",
};
export type Config = typeof config;
