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
  | "saved"
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
  { id: "matches",     icon: "🎯", label: "Job Matches",                     group: "workflow", href: "/dashboard" },
  { id: "inbox",       icon: "📬", label: "Inbox",                           group: "workflow", href: "/dashboard" },
  // ── Manage ──
  { id: "profile",     icon: "👤", label: "Profile Setup",                   group: "manage",   href: "/profile" },
  { id: "preferences", icon: "⚙️", label: "Job Preferences",                group: "manage",   href: "/profile" },
  { id: "tracker",     icon: "📊", label: "Application Tracker",             group: "manage",   href: "/dashboard" },
  { id: "saved",       icon: "⭐", label: "Saved Jobs",                      group: "manage",   href: "/dashboard" },
  { id: "analyzer",    icon: "🔬", label: "Manual Analyzer",                 group: "manage",   href: "/analyze" },
];
