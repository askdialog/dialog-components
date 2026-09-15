import type { FC } from "react";
import { splitTitleMatch } from "./titleHighlight";

interface HighlightedTitleProps {
  title: string;
  query: string;
}

/** Emphasizes the query match inside the title; without a match the full title is emphasized. */
export const HighlightedTitle: FC<HighlightedTitleProps> = ({
  title,
  query,
}) => {
  const parts = splitTitleMatch(title, query);
  if (parts === undefined) {
    return <span className="dialog-search-match">{title}</span>;
  }

  return (
    <>
      {parts.before !== "" && (
        <span className="dialog-search-muted">{parts.before}</span>
      )}
      <span className="dialog-search-match">{parts.match}</span>
      {parts.after !== "" && (
        <span className="dialog-search-muted">{parts.after}</span>
      )}
    </>
  );
};
