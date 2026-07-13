import { Dialog } from "../Dialog";
import { DialogAudit } from "../windowAudit";

declare global {
  interface Window {
    // Shared with other installation paths (GTM adds setVariant/getVariant);
    // never assign it wholesale — merge, or go through windowAudit helpers.
    dialog?: {
      instance?: Dialog;
      version?: string;
      audit?: DialogAudit;
    } & Record<string, unknown>;
  }
}

export {};
