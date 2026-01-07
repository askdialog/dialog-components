import type { FC } from "react";
import "./DialogBlockSuggestionsSkeleton.css";

export const DialogBlockSuggestionsSkeleton: FC = () => {
  return (
    <>
      <div className="dialog-block-suggestions-skeleton-item"></div>
      <div className="dialog-block-suggestions-skeleton-item"></div>
      <div className="dialog-block-suggestions-skeleton-item"></div>
    </>
  );
};
