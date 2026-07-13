import type { Dialog } from "./Dialog";

/**
 * Miniature copy of the window.dialog.audit merge helper — canonical source:
 * dialog-ecom/packages/lib-dialog-window (contract: dialogAuditSchema in
 * dialog-ecom's @dialog/shared-schemas). Kept in sync by hand: the surface is
 * public and additive-only — never overwrite keys owned by other installation
 * paths (GTM setVariant/getVariant/_queue, widget audit entries).
 */
export type DialogInstallationMethod =
  | "shopify-extension"
  | "gtm"
  | "sdk"
  | "react"
  | "vue"
  | "prestashop";

export type DialogAuditCapability =
  | "setVariant"
  | "assistant-modal"
  | "assistant-bar"
  | "pdp-block";

export interface DialogAuditMethodEntry {
  method: DialogInstallationMethod;
  version?: string;
  build?: { version?: string; commit?: string };
  source?: string;
  registeredAt: string;
}

export interface DialogAudit {
  methods: DialogAuditMethodEntry[];
  context: {
    hostname?: string;
    platform?: string;
    organizationSlug?: string;
  };
  capabilities: DialogAuditCapability[];
  consent?: unknown;
  warnings: string[];
}

export type DialogInstallationEntryInput = Omit<
  DialogAuditMethodEntry,
  "registeredAt"
>;

interface DialogWindowHost {
  dialog?: { audit?: DialogAudit } & Record<string, unknown>;
}

const MULTIPLE_METHODS_WARNING_PREFIX =
  "multiple installation methods detected:";

const getHost = (): DialogWindowHost | undefined =>
  typeof window === "undefined"
    ? undefined
    : (window as unknown as DialogWindowHost);

const ensureAudit = (): DialogAudit | undefined => {
  const host = getHost();
  if (host === undefined) {
    return undefined;
  }
  host.dialog = host.dialog ?? {};
  host.dialog.audit = host.dialog.audit ?? {
    methods: [],
    context: {},
    capabilities: [],
    warnings: [],
  };

  return host.dialog.audit;
};

const refreshCoexistenceWarning = (audit: DialogAudit): void => {
  audit.warnings = audit.warnings.filter(
    (warning) => !warning.startsWith(MULTIPLE_METHODS_WARNING_PREFIX),
  );
  if (audit.methods.length >= 2) {
    const methods = audit.methods.map((entry) => entry.method).join(", ");
    audit.warnings.push(`${MULTIPLE_METHODS_WARNING_PREFIX} ${methods}`);
  }
};

export const registerDialogInstallation = (
  entry: DialogInstallationEntryInput,
): void => {
  const audit = ensureAudit();
  if (audit === undefined) {
    return;
  }
  const existing = audit.methods.find(
    (candidate) => candidate.method === entry.method,
  );
  if (existing === undefined) {
    audit.methods.push({ ...entry, registeredAt: new Date().toISOString() });
    refreshCoexistenceWarning(audit);

    return;
  }
  // First write wins per field: a later registration only fills gaps and
  // never erases what another script recorded.
  existing.version = existing.version ?? entry.version;
  existing.build = existing.build ?? entry.build;
  existing.source = existing.source ?? entry.source;
};

export const addAuditCapability = (capability: DialogAuditCapability): void => {
  const audit = ensureAudit();
  if (audit === undefined) {
    return;
  }
  if (!audit.capabilities.includes(capability)) {
    audit.capabilities.push(capability);
  }
};

/**
 * Exposes the SDK on window.dialog without erasing fields owned by other
 * installation paths (e.g. GTM's setVariant/getVariant), then registers the
 * sdk entry in window.dialog.audit.
 */
export const exposeSdkOnWindowDialog = (
  instance: Dialog,
  version: string,
): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.dialog = {
    ...window.dialog,
    instance,
    version,
  };
  registerDialogInstallation({ method: "sdk", version });
};
