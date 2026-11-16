import { type FC, useEffect, useRef } from "react";
import type { Dialog, Suggestion } from "@askdialog/dialog-sdk";
import {
  trackProductQuestionClicked,
  trackProductQuestionViewed,
} from "@askdialog/dialog-sdk/events";
import { createImpressionTracker } from "@askdialog/dialog-sdk/impressions";
import { AiStarsIcon } from "../../icons/AiStarsIcon";
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

  useEffect(() => {
    // Keyed by position: a question may have no id.
    const tracker = createImpressionTracker({
      onImpressions: (positions) => {
        for (const key of positions) {
          const position = Number(key);
          trackProductQuestionViewed({
            product_question_id: questions[position - 1]?.id ?? null,
            product_id: productId,
            locale: client.locale,
            position,
            entry_point: "pdp_block",
            surface: "sdk_block",
            recommendation_id: recommendationId ?? null,
          });
        }
      },
    });
    buttons.current.slice(0, questions.length).forEach((button, index) => {
      if (button) {
        tracker.observe(button, String(index + 1));
      }
    });

    return () => tracker.disconnect();
  }, [client, productId, questions, recommendationId]);

  const handleClick = (
    question: Suggestion["questions"][number],
    index: number,
  ): void => {
    trackProductQuestionClicked({
      product_question_id: question.id ?? null,
      product_id: productId,
      locale: client.locale,
      position: index + 1,
      entry_point: "pdp_block",
      surface: "sdk_block",
      recommendation_id: recommendationId ?? null,
    });
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
