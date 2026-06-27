import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import Toast from "@/lib/toast-polyfill";

/**
 * Gate for write/transactional actions (add to cart, checkout, book, etc.).
 *
 * Returns a function that runs `action` and returns `true` when the user is
 * authenticated. For a guest (the auth wall is feature-flagged off) it instead
 * prompts them to sign in on demand — a toast plus a push to the login screen —
 * and returns `false` so the caller can bail out of the action.
 *
 * Usage:
 *   const requireAuth = useRequireAuth();
 *   const onAdd = () => { if (!requireAuth()) return; addToCart(); };
 */
export function useRequireAuth() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (action?: () => void): boolean => {
    if (isAuthenticated) {
      action?.();
      return true;
    }

    Toast.show({
      type: "info",
      text1: "Sign in required",
      text2: "Sign in or create an account to continue.",
    });
    router.push("/(auth)/login");
    return false;
  };
}
