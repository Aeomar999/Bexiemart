"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingBag, 
  AlertTriangle, 
  FileText, 
  Settings, 
  LogOut,
  Bike,
  Truck,
  Pizza,
  Wrench,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useUiStore } from "../../lib/stores/ui-store";
import { useAuthStore } from "../../lib/stores/auth-store";
import { useUser } from "../../lib/hooks/use-auth";

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  badge?: number | string;
  superAdminOnly?: boolean;
  subItems?: { name: string; href: string }[];
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const navigationConfig: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Reports", href: "/reports", icon: FileText },
    ]
  },
  {
    group: "Commerce",
    items: [
      { name: "Users", href: "/users", icon: Users },
      { 
        name: "Vendors & Stores", 
        icon: Store,
        subItems: [
          { name: "Retail Vendors", href: "/vendors" },
          { name: "Restaurants", href: "/food-vendors" },
          { name: "Service Providers", href: "/service-vendors" },
        ]
      },
      { 
        name: "Orders & Bookings", 
        icon: ShoppingBag,
        subItems: [
          { name: "Retail Orders", href: "/orders" },
          { name: "Food Orders", href: "/food-orders" },
          { name: "Service Bookings", href: "/service-bookings" },
        ]
      },
    ]
  },
  {
    group: "Logistics",
    items: [
      { name: "Dispatchers", href: "/dispatchers", icon: Bike },
      { name: "Deliveries", href: "/deliveries", icon: Truck },
    ]
  },
  {
    group: "Growth",
    items: [
      { 
        name: "Marketing", 
        icon: Megaphone,
        subItems: [
          { name: "Flash Sales", href: "/marketing/flash-sales" },
          { name: "Coupons", href: "/marketing/coupons" },
        ]
      },
      { name: "Referrals", href: "/referrals", icon: Ticket },
    ]
  },
  {
    group: "Moderation",
    items: [
      { 
        name: "Content", 
        icon: ShieldAlert,
        subItems: [
          { name: "Reels", href: "/moderation/reels" },
          { name: "Reviews", href: "/moderation/reviews" },
        ]
      },
      { name: "Disputes", href: "/disputes", icon: AlertTriangle, badge: 3 },
    ]
  },
  {
    group: "System",
    items: [
      { name: "Admins", href: "/admins", icon: ShieldCheck, superAdminOnly: true },
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const logout = useAuthStore((state) => state.logout);
  const { data: me } = useUser();
  const isSuperAdmin = !!me?.isSuperAdmin;

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newExpanded = { ...expandedItems };
    let changed = false;

    navigationConfig.forEach(group => {
      group.items.forEach(item => {
        if (item.subItems) {
          const isChildActive = item.subItems.some(sub => pathname === sub.href || pathname.startsWith(`${sub.href}/`));
          if (isChildActive && !newExpanded[item.name]) {
            newExpanded[item.name] = true;
            changed = true;
          }
        }
      });
    });

    if (changed) {
      setExpandedItems(newExpanded);
    }
  }, [pathname]);

  const toggleExpand = (name: string) => {
    if (!isSidebarOpen) {
      toggleSidebar();
      setExpandedItems(prev => ({ ...prev, [name]: true }));
    } else {
      setExpandedItems(prev => ({ ...prev, [name]: !prev[name] }));
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] transition-all duration-300 overflow-hidden",
        isSidebarOpen ? "w-[260px]" : "w-[72px]"
      )}
    >
      <div className="flex h-16 items-center justify-center border-b border-[var(--color-border)] px-4">
        {isSidebarOpen ? (
          <h1 className="text-xl font-bold text-[var(--color-primary)]">BexieMart</h1>
        ) : (
          <h1 className="text-xl font-bold text-[var(--color-primary)]">B</h1>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {navigationConfig.map((group, groupIdx) => (
          <div key={group.group} className="mb-6 px-3">
            {isSidebarOpen && (
              <h3 className="mb-2 px-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                {group.group}
              </h3>
            )}

            <div className="space-y-1">
              {group.items
                .filter((item) => !item.superAdminOnly || isSuperAdmin)
                .map((item) => {
                const isActive = item.href ? (pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))) : false;
                const isChildActive = item.subItems?.some(sub => pathname === sub.href || pathname.startsWith(`${sub.href}/`));
                const isExpanded = expandedItems[item.name];
                const Icon = item.icon;

                return (
                  <div key={item.name} className="flex flex-col">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text)]",
                          !isSidebarOpen && "justify-center px-0"
                        )}
                        title={!isSidebarOpen ? item.name : undefined}
                      >
                        <div className="flex items-center">
                          <Icon
                            className={cn(
                              "flex-shrink-0 transition-colors",
                              isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]",
                              isSidebarOpen ? "mr-3 h-5 w-5" : "h-6 w-6"
                            )}
                          />
                          {isSidebarOpen && <span>{item.name}</span>}
                        </div>
                        {isSidebarOpen && item.badge && (
                          <span className="ml-auto inline-flex items-center rounded-full bg-[var(--color-surface-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-text)]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <button
                        onClick={() => toggleExpand(item.name)}
                        className={cn(
                          "group relative flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                          isChildActive
                            ? "bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text)]",
                          !isSidebarOpen && "justify-center px-0"
                        )}
                        title={!isSidebarOpen ? item.name : undefined}
                      >
                        <div className="flex items-center">
                          <Icon
                            className={cn(
                              "flex-shrink-0 transition-colors",
                              isChildActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]",
                              isSidebarOpen ? "mr-3 h-5 w-5" : "h-6 w-6"
                            )}
                          />
                          {isSidebarOpen && <span>{item.name}</span>}
                        </div>
                        {isSidebarOpen && (
                          <div className="flex items-center">
                            {item.badge && (
                              <span className="mr-2 inline-flex items-center rounded-full bg-[var(--color-surface-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-text)]">
                                {item.badge}
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                            )}
                          </div>
                        )}
                      </button>
                    )}

                    {isSidebarOpen && isExpanded && item.subItems && (
                      <div className="mt-1 flex flex-col space-y-1 relative before:absolute before:left-[21px] before:top-0 before:bottom-0 before:w-[1px] before:bg-[var(--color-border)]">
                        {item.subItems.map((sub) => {
                          const isSubActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                          return (
                            <Link
                              key={sub.name}
                              href={sub.href}
                              className={cn(
                                "group relative flex items-center rounded-md py-2 pl-10 pr-3 text-sm font-medium transition-colors",
                                isSubActive
                                  ? "text-[var(--color-primary)]"
                                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                              )}
                            >
                              <div className="absolute left-[21px] top-1/2 w-3 h-[1px] bg-[var(--color-border)]"></div>
                              <span>{sub.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-card)]">
        <button
          onClick={logout}
          className={cn(
            "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] transition-colors",
            !isSidebarOpen && "justify-center px-0"
          )}
          title={!isSidebarOpen ? "Logout" : undefined}
        >
          <LogOut
            className={cn(
              "flex-shrink-0 transition-colors",
              isSidebarOpen ? "mr-3 h-5 w-5" : "h-6 w-6"
            )}
            aria-hidden="true"
          />
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
