"use client";

import React from "react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Truck, User, Lock, Bell } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Platform", href: "/settings/platform", icon: Settings },
    { name: "Delivery Pricing", href: "/settings/delivery", icon: Truck },
    { name: "Profile", href: "/settings/profile", icon: User },
    { name: "Security", href: "/settings/security", icon: Lock },
    { name: "Notifications", href: "/settings/notifications", icon: Bell },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Settings</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex flex-col space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-[var(--color-text-muted)]"}`} />
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="flex-1 w-full max-w-4xl">
            {children}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
