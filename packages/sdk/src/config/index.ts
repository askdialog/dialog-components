export const config = {
  baseApiUrl: "https://rtbzcxkmwj.execute-api.eu-west-1.amazonaws.com",
  // Nest monolith (production) — serves POST /public/search/lexical.
  monolithApiUrl: "https://n5e8pa4r9a.execute-api.eu-west-1.amazonaws.com",
  assistantUrl: "https://d2zm7i5bmzo6ze.cloudfront.net/assets/index.js",
};
export type Config = typeof config;
