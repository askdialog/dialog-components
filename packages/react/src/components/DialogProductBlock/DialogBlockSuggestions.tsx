import { type FC, useEffect, useMemo, useRef } from "react";
import { trackDialogEvent } from "@askdialog/dialog-sdk";
import type { Dialog, Suggestion } from "@askdialog/dialog-sdk";
import { createImpressionTracker } from "@askdialog/dialog-sdk/impressions";
import { AiStarsIcon } from "../../icons/AiStarsIcon";
import {
  PRODUCT_QUESTION_CLICKED,
  PRODUCT_QUESTION_VIEWED,
  productQuestionEventProperties,
} from "./productQuestionEvents";
import "./DialogBlockSuggestions.css";

interface DialogBlockSuggestionsProps {
  client: Dialog;
  questions: Suggestion["questions"];
  recommendationId: Suggestion["recommendationId"];
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}

export const DialogBlockSuggestions: FC<DialogBlockSuggestionsProps> = ({
  client,
  questions,
  recommendationId,
  productId,
  productTitle,
  selectedVariantId,
}) => {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const eventContext = useMemo(
    () => ({ productId, locale: client.locale, recommendationId }),
    [client, productId, recommendationId],
  );

  // A question without an id (legacy reader) is not measured.
  useEffect(() => {
    const viewed = new Map<string, number>();
    const tracker = createImpressionTracker({
      onImpressions: (ids) => {
        for (const id of ids) {
          trackDialogEvent(
            PRODUCT_QUESTION_VIEWED,
            productQuestionEventProperties(
              eventContext,
              id,
              viewed.get(id) ?? 0,
            ),
          );
        }
      },
    });
    questions.forEach(({ id }, index) => {
      const button = buttons.current[index];
      if (id && button) {
        viewed.set(id, index);
        tracker.observe(button, id);
      }
    });

    return () => tracker.disconnect();
  }, [eventContext, questions]);

  const handleClick = (
    question: Suggestion["questions"][number],
    index: number,
  ): void => {
    if (question.id) {
      trackDialogEvent(
        PRODUCT_QUESTION_CLICKED,
        productQuestionEventProperties(eventContext, question.id, index),
      );
    }
    client.sendProductMessage({
      productId,
      productTitle,
      selectedVariantId,
      question: question.question,
      fromQuestionSuggestion: true,
    });
  };

  return (
    <>
      {questions.map((question, index) => (
        <button
          key={question.question}
          ref={(button) => {
            buttons.current[index] = button;
          }}
          className="dialog-block-suggestions-item"
          onClick={() => handleClick(question, index)}
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
