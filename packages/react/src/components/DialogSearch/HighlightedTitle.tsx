import type { FC } from "react";
import type { TitleParts } from "@askdialog/dialog-sdk";

interface HighlightedTitleProps {
  parts: TitleParts;
}

export const HighlightedTitle: FC<HighlightedTitleProps> = ({
  parts: { before, match, after },
}) => (
  <>
    {before !== "" && <span className="dialog-search-muted">{before}</span>}
    <span className="dialog-search-match">{match}</span>
    {after !== "" && <span className="dialog-search-muted">{after}</span>}
  </>
);
