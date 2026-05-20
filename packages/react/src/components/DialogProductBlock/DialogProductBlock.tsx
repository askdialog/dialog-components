import { type FC, useEffect, useState, useMemo } from "react";
import { type Suggestion } from "@askdialog/dialog-sdk";
import type { Dialog } from "@askdialog/dialog-sdk";
import { DialogBlockHeader } from "./DialogBlockHeader";
import { DialogBlockSuggestionsContainer } from "./DialogBlockSuggestionsContainer";
import { DialogInput } from "./DialogInput";
import { ThemeProvider } from "./ThemeProvider";
import "./DialogProductBlock.css";

interface DialogProductBlockProps {
  client: Dialog;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
  enableInput?: boolean;
}

export const DialogProductBlock: FC<DialogProductBlockProps> = ({
  client,
  productId,
  productTitle,
  selectedVariantId,
  enableInput = true,
}) => {
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(true);
  const [suggestionData, setSuggestionData] = useState<Suggestion | undefined>(
    undefined,
  );

  const assistantName = useMemo(
    () => (isFetchingSuggestions ? "" : suggestionData?.assistantName),
    [suggestionData, isFetchingSuggestions],
  );
  const description = useMemo(
    () => (isFetchingSuggestions ? "" : suggestionData?.description),
    [suggestionData, isFetchingSuggestions],
  );
  const inputPlaceholder = useMemo(
    () => (isFetchingSuggestions ? "" : suggestionData?.inputPlaceholder),
    [suggestionData, isFetchingSuggestions],
  );

  useEffect(() => {
    let isActive = true;
    const handleFetchingSuggestions = async (): Promise<void> => {
      setIsFetchingSuggestions(true);
      setSuggestionData(undefined);
      try {
        const suggestion = await client.getSuggestions(productId);
        if (isActive) {
          setSuggestionData(suggestion);
        }
      } catch (error) {
        console.error("error", error);
      } finally {
        if (isActive) {
          setIsFetchingSuggestions(false);
        }
      }
    };

    handleFetchingSuggestions();
    return () => {
      isActive = false;
    };
  }, [client, productId]);

  return (
    <ThemeProvider theme={client.theme}>
      <div id="dialog-instant" className="dialog-block-container">
        <DialogBlockHeader title={assistantName} description={description} />
        <DialogBlockSuggestionsContainer
          client={client}
          questions={suggestionData?.questions}
          isLoading={isFetchingSuggestions}
          productId={productId}
          productTitle={productTitle}
          selectedVariantId={selectedVariantId}
        />
        {enableInput && (
          <DialogInput
            client={client}
            placeholder={inputPlaceholder}
            productId={productId}
            productTitle={productTitle}
            selectedVariantId={selectedVariantId}
          />
        )}
      </div>
    </ThemeProvider>
  );
};
