// Case- and diacritic-insensitive ("creme" highlights "Crème"); the upper/lower
// round trip gives ß, ẞ and SS one form, the sigma rewrite ignores final-sigma context.
const fold = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ẞ/gu, "ß")
    .toUpperCase()
    .toLowerCase()
    .replace(/ς/g, "σ");

export interface TitleParts {
  before: string;
  match: string;
  after: string;
}

// Indices refer to the title's code points: folding can change a character's
// length (è → e, ß → ss), so a folded-index → original-index map is required.
export const splitTitleMatch = (title: string, query: string): TitleParts => {
  const whole = { before: "", match: title, after: "" };
  const foldedQuery = fold(query.trim());
  if (foldedQuery === "") {
    return whole;
  }

  const characters = [...title];
  const foldedToOriginal: number[] = [];
  let folded = "";
  characters.forEach((character, index) => {
    const foldedCharacter = fold(character);
    for (let i = 0; i < foldedCharacter.length; i += 1) {
      foldedToOriginal.push(index);
    }
    folded += foldedCharacter;
  });

  const start = folded.indexOf(foldedQuery);
  if (start === -1) {
    return whole;
  }
  const startIndex = foldedToOriginal[start];
  const endIndex = foldedToOriginal[start + foldedQuery.length - 1] + 1;

  return {
    before: characters.slice(0, startIndex).join(""),
    match: characters.slice(startIndex, endIndex).join(""),
    after: characters.slice(endIndex).join(""),
  };
};
