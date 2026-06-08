import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Creates a fresh QueryClient wrapper for renderHook / render calls.
 *
 * Why: Each test needs an isolated QueryClient so cached data from one test
 * doesn't bleed into the next.  `retry: false` prevents flaky re-fetch loops,
 * and `gcTime: 0` ensures garbage-collected queries don't linger.
 *
 * @example
 * const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
 */
export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  // React Testing Library expects a component with a `children` prop
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

/**
 * Returns a QueryClient configured for tests.
 *
 * Useful when you need direct access to the client (e.g. to prefill cache):
 * @example
 * const queryClient = createTestQueryClient();
 * queryClient.setQueryData(["cart"], { items: [] });
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}
