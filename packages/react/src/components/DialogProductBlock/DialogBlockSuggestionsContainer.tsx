import type { FC } from "react";
import type { Dialog, Suggestion } from "@askdialog/dialog-sdk";
import { DialogBlockSuggestions } from "./DialogBlockSuggestions";
import { DialogBlockSuggestionsSkeleton } from "./DialogBlockSuggestionsSkeleton";
import "./DialogBlockSuggestionsContainer.css";

interface DialogBlockSuggestionsContainerProps {
  client: Dialog;
  questions: Suggestion["questions"] | undefined;
  isLoading: boolean;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}

export const DialogBlockSuggestionsContainer: FC<
  DialogBlockSuggestionsContainerProps
> = ({
  client,
  questions,
  isLoading,
  productId,
  productTitle,
  selectedVariantId,
}) => {
  return (
    <div className="dialog-block-suggestions-container">
      {isLoading || !questions ? (
        <DialogBlockSuggestionsSkeleton />
      ) : (
        <DialogBlockSuggestions
          client={client}
          questions={questions}
          productId={productId}
          productTitle={productTitle}
          selectedVariantId={selectedVariantId}
        />
      )}
    </div>
  );
};
