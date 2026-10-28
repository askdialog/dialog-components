import type { FC } from "react";
import type { Dialog, Suggestion } from "@askdialog/dialog-sdk";
import { getInputMessages } from "./inputMessages";
import "./DialogAskSomethingElse.css";

interface DialogAskSomethingElseProps {
  client: Dialog;
  questions: Suggestion["questions"] | undefined;
  disabled: boolean;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}

export const DialogAskSomethingElse: FC<DialogAskSomethingElseProps> = ({
  client,
  questions,
  disabled,
  productId,
  productTitle,
  selectedVariantId,
}) => {
  const handleClick = (): void => {
    client.openAssistantWithSuggestions({
      questions: questions ?? [],
      product: {
        id: productId,
        title: productTitle,
        selectedVariantId,
      },
    });
  };

  return (
    <button
      type="button"
      className="dialog-ask-something-else"
      disabled={disabled}
      onClick={handleClick}
    >
      {getInputMessages(client.locale).askSomethingElse}
    </button>
  );
};
