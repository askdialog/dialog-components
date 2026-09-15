// Matching is case- and diacritic-insensitive ("creme" highlights "Crème").
const fold = (value: string): string =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export interface TitleParts {
  before: string;
  match: string;
  after: string;
}

// Indices refer to the title's code points: folding can change a character's
// length (è → e), so a folded-index → original-index map is required.
export const splitTitleMatch = (
  title: string,
  query: string,
): TitleParts | undefined => {
  const foldedQuery = fold(query.trim());
  if (foldedQuery === "") {
    return undefined;
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
    return undefined;
  }
  const startIndex = foldedToOriginal[start];
  const endIndex = foldedToOriginal[start + foldedQuery.length - 1] + 1;

  return {
    before: characters.slice(0, startIndex).join(""),
    match: characters.slice(startIndex, endIndex).join(""),
    after: characters.slice(endIndex).join(""),
  };
};
