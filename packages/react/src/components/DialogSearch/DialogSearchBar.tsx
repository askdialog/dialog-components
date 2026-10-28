import type { FC, FormEvent } from "react";
import { connectSearchBox, type SearchController } from "@askdialog/dialog-sdk";
import { ArrowUpIcon } from "../../icons/ArrowUpIcon";
import { ShurikenIcon } from "../../icons/ShurikenIcon";
import { useConnector } from "./useConnector";
import "./DialogSearchBar.css";

interface DialogSearchBarProps {
  controller: SearchController;
  placeholder?: string;
  autoFocus?: boolean;
  submitAriaLabel?: string;
}

export const DialogSearchBar: FC<DialogSearchBarProps> = ({
  controller,
  placeholder = "Search products...",
  autoFocus = false,
  submitAriaLabel = "Search",
}) => {
  const [{ query }, searchBox] = useConnector(connectSearchBox, controller);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    searchBox.submit();
  };

  return (
    <form className="dialog-search-bar" role="search" onSubmit={handleSubmit}>
      <div className="dialog-search-bar-field">
        <span className="dialog-search-bar-icon">
          <ShurikenIcon />
        </span>
        <input
          type="text"
          name="dialog-search-query"
          className="dialog-search-bar-input"
          value={query}
          aria-label={placeholder}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => searchBox.open()}
          onChange={(event) => searchBox.refine(event.target.value)}
        />
      </div>
      <button
        type="submit"
        className="dialog-search-bar-submit"
        aria-label={submitAriaLabel}
      >
        <ArrowUpIcon />
      </button>
    </form>
  );
};
