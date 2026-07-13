import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Dialog } from "../Dialog";
import {
  addAuditCapability,
  DialogAudit,
  exposeSdkOnWindowDialog,
  registerDialogInstallation,
} from "../windowAudit";

interface TestWindow {
  dialog?: { audit?: DialogAudit } & Record<string, unknown>;
}

const globalWithWindow = globalThis as { window?: TestWindow };

const getAudit = (): DialogAudit | undefined =>
  globalWithWindow.window?.dialog?.audit;

const fakeInstance = { apiKey: "test" } as unknown as Dialog;

beforeEach(() => {
  globalWithWindow.window = {};
});

afterEach(() => {
  delete globalWithWindow.window;
  vi.clearAllMocks();
});

describe("exposeSdkOnWindowDialog", () => {
  it("exposes instance and version when window.dialog is absent", () => {
    exposeSdkOnWindowDialog(fakeInstance, "2.1.0");

    const dialog = globalWithWindow.window?.dialog;
    expect(dialog?.instance).toBe(fakeInstance);
    expect(dialog?.version).toBe("2.1.0");
    expect(getAudit()?.methods[0]).toMatchObject({
      method: "sdk",
      version: "2.1.0",
    });
  });

  it("preserves keys owned by GTM (setVariant/getVariant/_queue)", () => {
    const setVariant = vi.fn();
    const getVariant = vi.fn();
    const queue = [["setVariant", { variantId: "VAR_1" }]];
    globalWithWindow.window = {
      dialog: { setVariant, getVariant, _queue: queue },
    };

    exposeSdkOnWindowDialog(fakeInstance, "2.1.0");

    const dialog = globalWithWindow.window.dialog;
    expect(dialog?.setVariant).toBe(setVariant);
    expect(dialog?.getVariant).toBe(getVariant);
    expect(dialog?._queue).toBe(queue);
    expect(dialog?.instance).toBe(fakeInstance);
    expect(getAudit()?.methods[0]).toMatchObject({
      method: "sdk",
      version: "2.1.0",
    });
  });

  it("preserves audit entries registered by another path and warns on coexistence", () => {
    registerDialogInstallation({ method: "gtm", source: "dialog-instant.js" });

    exposeSdkOnWindowDialog(fakeInstance, "2.1.0");

    const audit = getAudit();
    expect(audit?.methods.map((entry) => entry.method)).toEqual(["gtm", "sdk"]);
    expect(audit?.warnings).toEqual([
      "multiple installation methods detected: gtm, sdk",
    ]);
  });

  it("does not duplicate the sdk entry when instantiated twice", () => {
    exposeSdkOnWindowDialog(fakeInstance, "2.1.0");
    exposeSdkOnWindowDialog(fakeInstance, "2.1.0");

    expect(getAudit()?.methods).toHaveLength(1);
  });

  it("is a no-op without a window (SSR safety)", () => {
    delete globalWithWindow.window;

    expect(() => exposeSdkOnWindowDialog(fakeInstance, "2.1.0")).not.toThrow();
    expect(() => addAuditCapability("pdp-block")).not.toThrow();
  });
});

describe("registerDialogInstallation", () => {
  it("only fills missing fields on re-registration of the same method", () => {
    registerDialogInstallation({ method: "react", version: "2.0.2" });
    registerDialogInstallation({ method: "react", version: "9.9.9" });

    expect(getAudit()?.methods).toHaveLength(1);
    expect(getAudit()?.methods[0]?.version).toBe("2.0.2");
  });

  it("fills missing nested build fields without erasing existing ones", () => {
    registerDialogInstallation({ method: "gtm", build: { commit: "abc1234" } });
    registerDialogInstallation({
      method: "gtm",
      build: { commit: "fff9999", version: "1.2.3" },
    });

    expect(getAudit()?.methods[0]?.build).toEqual({
      commit: "abc1234",
      version: "1.2.3",
    });
  });
});

describe("addAuditCapability", () => {
  it("adds capabilities without duplicates", () => {
    addAuditCapability("pdp-block");
    addAuditCapability("pdp-block");

    expect(getAudit()?.capabilities).toEqual(["pdp-block"]);
  });
});
