import type { FC } from "react";
import { splitTitleMatch } from "./titleHighlight";

interface HighlightedTitleProps {
  title: string;
  query: string;
}

export const HighlightedTitle: FC<HighlightedTitleProps> = ({
  title,
  query,
}) => {
  const { before, match, after } = splitTitleMatch(title, query);

  return (
    <>
      {before !== "" && <span className="dialog-search-muted">{before}</span>}
      <span className="dialog-search-match">{match}</span>
      {after !== "" && <span className="dialog-search-muted">{after}</span>}
    </>
  );
};
