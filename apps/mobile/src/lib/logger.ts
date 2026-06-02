import * as Sentry from "@sentry/react-native";

export const logger = {
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    if (__DEV__) {
      console.error(message, error);
    } else {
      Sentry.captureException(error || new Error(message), {
        extra: context,
      });
    }
  },
  info: (message: string, data?: Record<string, unknown>) => {
    if (__DEV__) console.log(message, data);
    else Sentry.addBreadcrumb({ message, data });
  },
};
