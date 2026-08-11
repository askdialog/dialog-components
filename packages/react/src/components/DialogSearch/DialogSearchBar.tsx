import { type FC, type FormEvent, useState } from "react";
import type { SearchController } from "@askdialog/dialog-sdk";
import { ArrowUpIcon } from "../../icons/ArrowUpIcon";
import { ShurikenIcon } from "../../icons/ShurikenIcon";
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
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    controller.submit(value);
  };

  return (
    <form className="dialog-search-bar" role="search" onSubmit={handleSubmit}>
      <div className="dialog-search-bar-field">
        <span className="dialog-search-bar-icon">
          <ShurikenIcon />
        </span>
        <input
          type="text"
          className="dialog-search-bar-input"
          value={value}
          aria-label={placeholder}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(event) => {
            setValue(event.target.value);
            controller.setQuery(event.target.value);
          }}
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
