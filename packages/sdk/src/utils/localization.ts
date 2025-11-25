export interface DetailedLocaleInfo {
  language: string;
  countryCode: string;
  formatted: string;
  locale: string;
}

export const getDetailedLocaleInfo = (
  locale: string,
): DetailedLocaleInfo | null => {
  try {
    const localeObj = new Intl.Locale(locale);
    const language = localeObj.language;
    const countryCode = localeObj.region ?? localeObj.maximize().region;

    const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
    const languageName = languageNames.of(language);

    if (languageName === undefined || countryCode === undefined) {
      return null;
    }

    return {
      language: languageName,
      countryCode,
      formatted: `${language}-${countryCode}`,
      locale,
    };
  } catch {
    return null;
  }
};
