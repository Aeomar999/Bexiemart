"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OrdersError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-red-50 p-4 dark:bg-red-950/20">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="mt-6 text-xl font-bold text-[var(--color-text)]">
        Failed to load orders
      </h2>
      <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
        We couldn&apos;t load the orders data. Please try again.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-[var(--color-text-muted)]">
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
