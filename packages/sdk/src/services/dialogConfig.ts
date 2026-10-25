import { config } from "../config";
import { DialogConfig } from "../types/dialogConfig";

const DIALOG_CONFIG_PATH = "/widget/dialog-config";
const API_KEY_HEADER = "x-dialog-api-key";

export const loadDialogConfig = async (
  apiKey: string,
  locale: string,
): Promise<DialogConfig> => {
  const query = new URLSearchParams({ locale });
  const response = await fetch(
    `${config.monolithApiUrl}${DIALOG_CONFIG_PATH}?${query.toString()}`,
    { headers: { [API_KEY_HEADER]: apiKey } },
  );
  if (!response.ok) {
    throw new Error(`Dialog config request failed (${response.status}).`);
  }

  return (await response.json()) as DialogConfig;
};
