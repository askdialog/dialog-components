import { type FC, useState } from "react";
import type { Dialog } from "@askdialog/dialog-sdk";
import {
  DialogSearchBar,
  DialogSearchResults,
  type SearchProductsLayout,
  useDialogSearch,
} from "@askdialog/dialog-react";

// Only for a catalog exposing a collections index: a missing one fails the whole search.
const sections =
  import.meta.env.VITE_DIALOG_SEARCH_COLLECTIONS === "true"
    ? [{ index: "collections" as const, hitsPerPage: 5 }]
    : [];

export const SearchDemo: FC<{ client: Dialog }> = ({ client }) => {
  const [layout, setLayout] = useState<SearchProductsLayout>("list");
  const { controller, state, theme } = useDialogSearch({
    client,
    language: "fr",
    currency: client.currency,
    sections,
  });

  return (
    <section className="search-demo">
      <label className="search-demo-layout">
        Products layout
        <select
          value={layout}
          onChange={(event) =>
            setLayout(event.target.value as SearchProductsLayout)
          }
        >
          <option value="list">list</option>
          <option value="grid">grid</option>
        </select>
      </label>
      <DialogSearchBar
        controller={controller}
        placeholder="Search the catalog..."
      />
      <DialogSearchResults
        controller={controller}
        state={state}
        locale="fr-FR"
        theme={theme}
        layout={layout}
      />
    </section>
  );
};
