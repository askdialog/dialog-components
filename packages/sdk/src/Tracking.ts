import posthog, { PostHog } from "posthog-js";
import { TrackingEvents } from "./types/trackings";
import { config } from "./config";
export class Tracking {
  private _posthog: PostHog;
  private readonly _token = config.posthogApiKey;
  private readonly _apiHost = "https://eu.i.posthog.com";
  private readonly _apiKey: string;

  constructor(apiKey: string) {
    this._apiKey = apiKey;
    this._posthog = posthog.init(this._token, {
      api_host: this._apiHost,
      autocapture: false,
      disable_session_recording: true,
      capture_pageleave: false,
      capture_pageview: false,
      capture_performance: false,
    });
  }

  public track(
    event: TrackingEvents,
    properties?: Record<string, unknown>,
  ): void {
    const defaultProperties = {
      $host: window.location.hostname,
      $pathname: window.location.pathname,
      url: window.location.href,
      apiKey: this._apiKey,
    };
    this._posthog.capture(event, { ...defaultProperties, ...properties });
  }
}
