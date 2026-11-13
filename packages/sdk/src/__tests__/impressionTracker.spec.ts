import { describe, expect, it, vi } from "vitest";
import { createImpressionTracker } from "../impressions";
import {
  element,
  fireWindowEvent,
  intersect,
  stubImpressionEnvironment,
} from "./impressionStubs";

stubImpressionEnvironment();

describe("createImpressionTracker", () => {
  it("counts an item half visible for one continuous second, then batches it on idle", () => {
    const onImpressions = vi.fn();
    const tracker = createImpressionTracker({ onImpressions });
    const card = element();
    tracker.observe(card, "item-1");

    intersect(card, 0.5);
    vi.advanceTimersByTime(999);
    tracker.flush();
    expect(onImpressions).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1 + 1500);
    expect(onImpressions).toHaveBeenCalledWith(["item-1"]);
  });

  it("does not count an item less than half visible, or visible for less than a continuous second", () => {
    const onImpressions = vi.fn();
    const tracker = createImpressionTracker({ onImpressions });
    const hidden = element();
    const glimpsed = element();
    tracker.observe(hidden, "item-1");
    tracker.observe(glimpsed, "item-2");

    intersect(hidden, 0.49);
    intersect(glimpsed, 0.6);
    vi.advanceTimersByTime(900);
    intersect(glimpsed, 0.2);
    intersect(glimpsed, 0.6);
    vi.advanceTimersByTime(900);
    tracker.flush();

    expect(onImpressions).not.toHaveBeenCalled();
  });

  it("counts an item once per context, even from several elements or a forced record", () => {
    const onImpressions = vi.fn();
    const tracker = createImpressionTracker({ onImpressions });
    const card = element();
    const sameItem = element();
    tracker.observe(card, "item-1");
    tracker.observe(sameItem, "item-1");

    intersect(card, 0.6);
    intersect(sameItem, 0.6);
    vi.advanceTimersByTime(1000);
    intersect(card, 0.1);
    intersect(card, 0.6);
    vi.advanceTimersByTime(1000);
    tracker.record("item-1");
    tracker.flush();
    expect(onImpressions.mock.calls).toEqual([[["item-1"]]]);

    tracker.reset();
    tracker.observe(card, "item-1");
    intersect(card, 0.6);
    vi.advanceTimersByTime(1000);
    tracker.flush();
    expect(onImpressions).toHaveBeenCalledTimes(2);
  });

  it("sends the pending batch on reset, at the batch limit and on pagehide", () => {
    const onImpressions = vi.fn();
    const tracker = createImpressionTracker({
      onImpressions,
      maxItemsPerBatch: 2,
    });

    tracker.record("item-1");
    tracker.reset();
    tracker.record("item-2");
    tracker.record("item-3");
    tracker.record("item-4");
    fireWindowEvent("pagehide");

    expect(onImpressions.mock.calls).toEqual([
      [["item-1"]],
      [["item-2", "item-3"]],
      [["item-4"]],
    ]);
  });

  it("counts items again, after a fresh second, when the page is restored from the back/forward cache", () => {
    const onImpressions = vi.fn();
    const tracker = createImpressionTracker({ onImpressions });
    const card = element();
    const other = element();
    tracker.observe(card, "item-1");
    tracker.observe(other, "item-2");
    intersect(card, 0.6);
    vi.advanceTimersByTime(1000);
    intersect(other, 0.6);
    vi.advanceTimersByTime(300);
    tracker.flush();

    fireWindowEvent("pageshow", { persisted: true });
    intersect(card, 0.6);
    intersect(other, 0.6);
    vi.advanceTimersByTime(999);
    tracker.flush();
    expect(onImpressions.mock.calls).toEqual([[["item-1"]]]);

    vi.advanceTimersByTime(1);
    tracker.flush();
    expect(onImpressions.mock.calls[1]).toEqual([["item-1", "item-2"]]);
  });
});
