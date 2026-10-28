import { type FC, useRef, useState, type KeyboardEvent } from "react";
import type { Dialog } from "@askdialog/dialog-sdk";
import { ArrowIcon } from "../../icons/ArrowIcon";
import { getInputMessages } from "./inputMessages";
import "./DialogInput.css";

interface DialogInputProps {
  client: Dialog;
  /** @deprecated Ignored: the input always shows the fixed AI text. */
  placeholder?: string;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}

export const DialogInput: FC<DialogInputProps> = ({
  client,
  productId,
  productTitle,
  selectedVariantId,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const messages = getInputMessages(client.locale);

  const focusInput = (): void => {
    inputRef.current?.focus();
  };

  const handleSubmitQuestion = (): void => {
    const question = inputValue;
    if (!question.trim()) {
      return;
    }

    client.sendProductMessage({
      productId,
      productTitle,
      selectedVariantId,
      question,
      fromQuestionSuggestion: true,
    });
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmitQuestion();
    }
  };

  return (
    <div className="dialog-input-container">
      <div className="dialog-input-wrapper" onClick={focusInput}>
        <input
          id="dialog-ask-anything-input-ai-input"
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="dialog-ask-anything-input-ai-input"
          placeholder={messages.placeholder}
          aria-describedby="dialog-input-ai-disclosure"
          onKeyDown={handleKeyDown}
        />

        <button
          id="send-message-button-ai-input"
          className="dialog-input-submit"
          disabled={!inputValue.trim()}
          onClick={handleSubmitQuestion}
        >
          <ArrowIcon color={client.theme.ctaTextColor} />
        </button>
      </div>
      <p id="dialog-input-ai-disclosure" className="dialog-input-ai-disclosure">
        {messages.aiDisclosure}
      </p>
    </div>
  );
};
