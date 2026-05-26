import { Redirect } from "expo-router";
import { useAuthStore } from "../src/lib/stores/auth-store";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === "vendor") {
    return <Redirect href="/(vendor)/(dashboard)" />;
  }

  return <Redirect href="/(customer)/(home)" />;
}