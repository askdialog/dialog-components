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
    () => suggestionData?.assistantName,
    [suggestionData],
  );
  const description = useMemo(
    () => suggestionData?.description,
    [suggestionData],
  );
  const inputPlaceholder = useMemo(
    () => suggestionData?.inputPlaceholder,
    [suggestionData],
  );

  useEffect(() => {
    const handleFetchingSuggestions = async (): Promise<void> => {
      try {
        const suggestion = await client.getSuggestions(productId);
        setSuggestionData(suggestion);
        setIsFetchingSuggestions(false);
      } catch (error) {
        console.error("error", error);
      }
    };

    handleFetchingSuggestions();
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
