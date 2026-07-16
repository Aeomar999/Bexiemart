import { PostHogService } from "./posthog.service";

describe("PostHogService", () => {
  let service: PostHogService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should initialize safely without POSTHOG_API_KEY and return default value for flags", async () => {
    delete process.env.POSTHOG_API_KEY;
    service = new PostHogService();

    const enabled = await service.isFeatureEnabled("any-flag", "user_1");
    expect(enabled).toBe(true);

    const disabledDefault = await service.isFeatureEnabled("any-flag", "user_1", false);
    expect(disabledDefault).toBe(false);
  });

  it("should not throw when capturing events without POSTHOG_API_KEY", () => {
    delete process.env.POSTHOG_API_KEY;
    service = new PostHogService();
    expect(() => service.capture("test_event", { foo: "bar" })).not.toThrow();
  });
});
