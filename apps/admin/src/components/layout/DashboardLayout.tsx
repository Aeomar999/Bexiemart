"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuthStore } from "../../lib/stores/auth-store";
import { useAdminRealtimeUpdates } from "../../lib/hooks/use-realtime";
import { Toaster } from "sonner";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize socket connections and realtime listeners
  useAdminRealtimeUpdates();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted && !isAuthenticated && pathname !== "/login") {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, pathname, router]);

  // Prevent hydration mismatch
  if (!mounted) return null;

  if (!isAuthenticated && pathname === "/login") {
    return <>{children}</>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg)] p-6 animate-fade-in">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
