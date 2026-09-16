/**
 * Maps raw backend error messages to user-friendly translations.
 * Returns the provided friendly fallback if the exact error is unknown or too technical.
 */
export function getUserFriendlyErrorMessage(error: any, fallback: string): string {
  if (!error) return fallback;

  const rawMessage =
    typeof error === "string" ? error : error?.response?.data?.message || error?.message || "";

  if (!rawMessage || typeof rawMessage !== "string") return fallback;

  const lowerMsg = rawMessage.toLowerCase();

  // Known backend errors mapping
  if (
    lowerMsg.includes("unauthenticated") ||
    lowerMsg.includes("unauthorized") ||
    lowerMsg.includes("invalid token")
  ) {
    return "Your session has expired or is invalid. Please log in again.";
  }
  if (
    lowerMsg.includes("constraint violation") ||
    lowerMsg.includes("unique") ||
    lowerMsg.includes("duplicate")
  ) {
    return "This record already exists. Please try a different value.";
  }
  if (lowerMsg.includes("not found")) {
    return "We couldn't find the requested information. It may have been removed.";
  }
  if (
    lowerMsg.includes("network error") ||
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("timeout")
  ) {
    return "We're having trouble connecting to the server. Please check your internet connection.";
  }
  if (lowerMsg.includes("validation")) {
    return "Some of the details provided are invalid. Please check your input and try again.";
  }
  if (
    lowerMsg.includes("insufficient funds") ||
    lowerMsg.includes("not enough balance") ||
    lowerMsg.includes("not enough coins")
  ) {
    return "You don't have enough balance for this action.";
  }
  if (lowerMsg.includes("rate limit") || lowerMsg.includes("too many requests")) {
    return "You're doing that too fast. Please wait a moment and try again.";
  }

  // If it's a technical database error, always use the fallback.
  if (
    lowerMsg.includes("sql") ||
    lowerMsg.includes("database") ||
    lowerMsg.includes("internal server error")
  ) {
    return fallback;
  }

  // To be safe and consistently user-friendly, if we haven't matched a known safe error, we use the fallback.
  // This prevents random technical strings from bleeding through to the UI.
  return fallback;
}
