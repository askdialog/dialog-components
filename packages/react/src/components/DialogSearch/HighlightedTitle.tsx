import type { FC } from "react";
import type { TitlePart } from "@askdialog/dialog-sdk";

interface HighlightedTitleProps {
  parts: readonly TitlePart[];
}

/** The title as text, the parts the engine matched in bold. */
export const HighlightedTitle: FC<HighlightedTitleProps> = ({ parts }) => (
  <>
    {parts.map(({ text, highlighted }, index) =>
      highlighted ? (
        <span key={index} className="dialog-search-match">
          {text}
        </span>
      ) : (
        text
      ),
    )}
  </>
);
