import type { TKey } from "./translations";

/* ─────────────────────────────────────────────────────────
   Canonical sidebar navigation items.
   Single source of truth used by DashboardLayout.
   Labels are translation keys resolved at render time.
   ───────────────────────────────────────────────────────── */

/* "analyzer" has no sidebar entry — /analyze stays reachable by URL
   as an internal tool and still uses the shared layout. */
export type NavId =
  | "auto-apply"
  | "review"
  | "inbox"
  | "profile"
  | "preferences"
  | "tracker"
  | "analyzer";

export interface NavItem {
  id: NavId;
  icon: string;
  labelKey: TKey;
  badge?: string;
  href: string;
  group: "workflow" | "manage";
}

export const navItems: NavItem[] = [
  // ── Workflow ──
  { id: "auto-apply",  icon: "🛰️", labelKey: "nav.controlCenter",  badge: "8", group: "workflow", href: "/dashboard" },
  { id: "review",      icon: "📋", labelKey: "nav.reviewQueue",    badge: "4", group: "workflow", href: "/review-queue" },
  { id: "inbox",       icon: "📬", labelKey: "nav.inbox",          badge: "3", group: "workflow", href: "/inbox" },
  // ── Manage ──
  { id: "profile",     icon: "👤", labelKey: "nav.profileSetup",               group: "manage",   href: "/profile" },
  { id: "preferences", icon: "⚙️", labelKey: "nav.jobPreferences",            group: "manage",   href: "/profile#preferences" },
  { id: "tracker",     icon: "📊", labelKey: "nav.tracker",                    group: "manage",   href: "/tracker" },
];
