"use client";

import React from "react";
import { Menu, Bell } from "lucide-react";
import { useUiStore } from "../../lib/stores/ui-store";
import { useAuthStore } from "../../lib/stores/auth-store";

export function Header() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-md px-4 shadow-sm transition-all sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        onClick={toggleSidebar}
      >
        <span className="sr-only">Toggle sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-[var(--color-border)]" aria-hidden="true" />

      <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-[var(--color-border)]" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="-m-1.5 flex items-center p-1.5"
              id="user-menu-button"
              aria-expanded="false"
              aria-haspopup="true"
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
                {user?.firstName?.charAt(0) || "A"}
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-[var(--color-text)]" aria-hidden="true">
                  {user ? `${user.firstName} ${user.lastName}` : "Admin"}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
