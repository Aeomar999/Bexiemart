import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { PostHog } from "posthog-node";

@Injectable()
export class PostHogService implements OnModuleDestroy {
  private readonly logger = new Logger(PostHogService.name);
  private client: PostHog | null = null;

  constructor() {
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || "https://us.i.posthog.com";

    if (apiKey) {
      try {
        this.client = new PostHog(apiKey, {
          host,
          flushAt: 20,
          flushInterval: 10000,
        });
        this.logger.log(`PostHog client initialized successfully against host: ${host}`);
      } catch (error) {
        this.logger.error(`Failed to initialize PostHog client: ${error?.message || error}`);
      }
    } else {
      this.logger.warn(
        "POSTHOG_API_KEY not provided in environment; PostHog tracking and remote flags disabled (fail-safe defaults applied)."
      );
    }
  }

  /**
   * Checks if a feature flag is enabled for a given distinct ID.
   *
   * @param flagKey The PostHog feature flag key (e.g. 'flash-sales-active')
   * @param distinctId User ID or system ID (defaults to 'server_default')
   * @param defaultValue Fail-safe default if PostHog is unreachable or unconfigured (defaults to true)
   */
  async isFeatureEnabled(
    flagKey: string,
    distinctId = "server_default",
    defaultValue = true
  ): Promise<boolean> {
    if (!this.client) {
      return defaultValue;
    }

    try {
      const result = await Promise.race([
        this.client.isFeatureEnabled(flagKey, distinctId),
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500)),
      ]);

      if (result === undefined) {
        return defaultValue;
      }
      return Boolean(result);
    } catch (error) {
      this.logger.error(`Error evaluating feature flag [${flagKey}]: ${error?.message || error}`);
      return defaultValue;
    }
  }

  /**
   * Captures an event in PostHog for telemetry and audit analysis.
   */
  capture(
    event: string,
    properties: Record<string, any> = {},
    distinctId = "server_default"
  ): void {
    if (!this.client) {
      return;
    }

    try {
      this.client.capture({
        distinctId,
        event,
        properties: {
          ...properties,
          environment: process.env.NODE_ENV || "development",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to capture PostHog event [${event}]: ${error?.message || error}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.shutdown();
        this.logger.log("PostHog client shut down cleanly.");
      } catch (error) {
        this.logger.error(`Error shutting down PostHog client: ${error?.message || error}`);
      }
    }
  }
}
