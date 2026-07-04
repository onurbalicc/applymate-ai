/* ─────────────────────────────────────────────────────────
   Canonical sidebar navigation items.
   Single source of truth used by DashboardLayout.
   ───────────────────────────────────────────────────────── */

export type NavId =
  | "auto-apply"
  | "review"
  | "matches"
  | "inbox"
  | "profile"
  | "preferences"
  | "tracker"
  | "analyzer";

export interface NavItem {
  id: NavId;
  icon: string;
  label: string;
  badge?: string;
  href: string;
  group: "workflow" | "manage";
}

export const navItems: NavItem[] = [
  // ── Workflow ──
  { id: "auto-apply",  icon: "🚀", label: "Auto Apply",          badge: "8", group: "workflow", href: "/dashboard" },
  { id: "review",      icon: "📋", label: "Review Queue",        badge: "4", group: "workflow", href: "/review-queue" },
  { id: "matches",     icon: "🎯", label: "Job Matches",                     group: "workflow", href: "/dashboard#matches" },
  { id: "inbox",       icon: "📬", label: "Inbox",                           group: "workflow", href: "/dashboard#inbox" },
  // ── Manage ──
  { id: "profile",     icon: "👤", label: "Profile Setup",                   group: "manage",   href: "/profile" },
  { id: "preferences", icon: "⚙️", label: "Job Preferences",                group: "manage",   href: "/profile#preferences" },
  { id: "tracker",     icon: "📊", label: "Application Tracker",             group: "manage",   href: "/dashboard#tracker" },
  { id: "analyzer",    icon: "🔬", label: "Manual Analyzer",                 group: "manage",   href: "/analyze" },
];
