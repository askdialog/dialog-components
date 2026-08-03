export const config = {
  baseApiUrl: "https://abkjr5ukvi.execute-api.eu-west-1.amazonaws.com",
  // Nest monolith (staging) — serves POST /public/search.
  monolithApiUrl: "https://fvcphlqyle.execute-api.eu-west-1.amazonaws.com",
  assistantUrl: "https://d2bycosa71tnxv.cloudfront.net/assets/index.js",
};
export type Config = typeof config;
