import { describe, expect, it, vi } from "vitest";
import { SearchAnalyticsEnvelope } from "../types/searchAnalytics";
import { createSearchImpressionTracker } from "../utils/searchImpressions";
import {
  element,
  fireWindowEvent,
  intersect,
  stubImpressionEnvironment,
} from "./impressionStubs";

const envelope: SearchAnalyticsEnvelope = {
  query_id: "query-1",
  index: "products_fr_fr",
  surface: "search_page",
  search_type: "lexical",
  page: 1,
  total_hits: 42,
  query_length: 6,
};

stubImpressionEnvironment();

describe("createSearchImpressionTracker", () => {
  it("emits the result half visible for one second, at the position of the element seen", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const unseen = element();
    const card = element();
    tracker.observe(unseen, { product_id: "product-1", position: 2 });
    tracker.observe(card, { product_id: "product-1", position: 7 });

    intersect(card, 0.6);
    vi.advanceTimersByTime(999);
    tracker.flush();
    expect(emit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1 + 1500);
    expect(emit).toHaveBeenCalledWith({
      ...envelope,
      items: [{ product_id: "product-1", position: 7 }],
    });
  });

  it("flushes pending impressions under their own envelope when the context changes", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });
    intersect(card, 0.6);
    vi.advanceTimersByTime(1000);

    tracker.setContext({ ...envelope, query_id: "query-2", page: 2 });

    expect(emit).toHaveBeenCalledWith({
      ...envelope,
      items: [{ product_id: "product-1", position: 1 }],
    });
  });

  it("restarts deduplication on every context change: each response mints a fresh query_id", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });
    intersect(card, 0.6);
    vi.advanceTimersByTime(1000);

    tracker.setContext({ ...envelope, query_id: "query-2", page: 2 });
    const cardOnPage2 = element();
    tracker.observe(cardOnPage2, { product_id: "product-1", position: 25 });
    intersect(cardOnPage2, 0.6);
    vi.advanceTimersByTime(1000);
    fireWindowEvent("pagehide");

    expect(emit).toHaveBeenLastCalledWith({
      ...envelope,
      query_id: "query-2",
      page: 2,
      items: [{ product_id: "product-1", position: 25 }],
    });
  });

  it("forces the clicked item's impression and flushes immediately, once", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);

    tracker.forceImpression({ product_id: "product-1", position: 1 });
    tracker.forceImpression({ product_id: "product-1", position: 1 });

    expect(emit.mock.calls).toEqual([
      [{ ...envelope, items: [{ product_id: "product-1", position: 1 }] }],
    ]);
  });

  it("emits nothing before a context or when no impression qualified", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.forceImpression({ product_id: "product-1", position: 1 });
    tracker.setContext(envelope);

    tracker.flush();
    fireWindowEvent("pagehide");

    expect(emit).not.toHaveBeenCalled();
  });
});
