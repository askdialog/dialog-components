export interface DetailedLocaleInfo {
  language: string;
  languageCode: string;
  countryCode: string;
  formatted: string;
  locale: string;
}

export const isValidCountryCode = (
  countryCode: string | undefined,
): countryCode is string =>
  countryCode !== undefined && /^[A-Za-z]{2}$/.test(countryCode);

/**
 * Resolves the detailed locale information used by the assistant.
 *
 * The effective region follows this precedence:
 *   1. `countryCodeOverride` (explicit SDK parameter),
 *   2. the region embedded in `locale` (e.g. `en-US` -> `US`),
 *   3. the region guessed from the language via `Intl.Locale.maximize()`.
 *
 * The override (1) and the locale region (2) are considered "explicit" and also
 * drive the language display name (e.g. `en-GB` -> "British English"). The
 * `maximize()` fallback (3) only feeds the country code: a bare language code
 * therefore keeps a generic language name ("French", not "French (France)").
 */
export const getDetailedLocaleInfo = (
  locale: string,
  countryCodeOverride?: string,
): DetailedLocaleInfo | null => {
  try {
    const localeObj = new Intl.Locale(locale);
    const language = localeObj.language;

    const overrideRegion = isValidCountryCode(countryCodeOverride)
      ? countryCodeOverride.toUpperCase()
      : undefined;
    const explicitRegion = overrideRegion ?? localeObj.region;
    const countryCode = explicitRegion ?? localeObj.maximize().region;

    if (countryCode === undefined) {
      return null;
    }

    const baseNameForLanguage =
      explicitRegion !== undefined
        ? `${language}-${explicitRegion}`
        : localeObj.baseName;
    const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
    const languageName = languageNames.of(baseNameForLanguage);

    if (languageName === undefined) {
      return null;
    }

    return {
      language: languageName,
      languageCode: language,
      countryCode,
      formatted: `${language}-${countryCode}`,
      locale,
    };
  } catch {
    return null;
  }
};
