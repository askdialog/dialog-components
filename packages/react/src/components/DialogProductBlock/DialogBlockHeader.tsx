import type { FC } from "react";
import "./DialogBlockHeader.css";

interface DialogBlockHeaderProps {
  title?: string;
  description?: string;
}

export const DialogBlockHeader: FC<DialogBlockHeaderProps> = ({
  title = "Your expert",
  description = "A question about this product?",
}) => {
  return (
    <div className="dialog-block-header-container">
      <div className="dialog-block-title">{title}</div>
      <div className="dialog-block-description">{description}</div>
    </div>
  );
};
