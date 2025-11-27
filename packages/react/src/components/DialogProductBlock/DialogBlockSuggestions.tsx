import type { FC } from "react";
import type { Dialog, Suggestion } from "@askdialog/dialog-sdk";
import { AiStarsIcon } from "../../icons/AiStarsIcon";
import "./DialogBlockSuggestions.css";

interface DialogBlockSuggestionsProps {
  client: Dialog;
  questions: Suggestion["questions"];
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}

export const DialogBlockSuggestions: FC<DialogBlockSuggestionsProps> = ({
  client,
  questions,
  productId,
  productTitle,
  selectedVariantId,
}) => {
  const handleClick = (question: string): void => {
    client.sendProductMessage({
      productId,
      productTitle,
      selectedVariantId,
      question,
      fromQuestionSuggestion: true,
    });
  };

  return (
    <>
      {questions.map((question) => (
        <button
          key={question.question}
          className="dialog-block-suggestions-item"
          onClick={() => handleClick(question.question)}
        >
          <AiStarsIcon color={client.theme.primaryColor} />
          <span className="dialog-block-suggestions-item-label">
            {question.question}
          </span>
        </button>
      ))}
    </>
  );
};
