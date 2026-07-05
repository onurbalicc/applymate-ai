"use client";

import { useState } from "react";
import Link from "next/link";
import { navItems, type NavId } from "@/app/lib/nav-items";
import { useI18n, useTheme } from "@/app/lib/i18n";
import { useApplicationState } from "@/app/lib/application-state";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

/* ─────────────────────────────────────────────────────────
   Shared Dashboard Layout
   Used by all app pages. Theme + language preferences come
   from the shared localStorage-backed stores in lib/i18n.
   ───────────────────────────────────────────────────────── */

interface DashboardLayoutProps {
  activeNavId: NavId;
  pageTitle?: string;
  /** Optional element rendered on the right side of the top bar */
  topBarRight?: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardLayout({
  activeNavId,
  pageTitle,
  topBarRight,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const { pendingCount } = useApplicationState();

  /* Review Queue badge follows the demo state; other badges stay static */
  const badgeFor = (item: (typeof navItems)[number]) =>
    item.id === "review" ? (pendingCount > 0 ? String(pendingCount) : undefined) : item.badge;

  const activeItem = navItems.find((n) => n.id === activeNavId);
  const resolvedTitle = pageTitle ?? (activeItem ? t(activeItem.labelKey) : "Dashboard");

  const workflowItems = navItems.filter((n) => n.group === "workflow");
  const manageItems = navItems.filter((n) => n.group === "manage");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────── */}
      <aside className={`dash-sidebar ${sidebarOpen ? "dash-sidebar--open" : ""}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
            >
              A
            </div>
            <span
              className="font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              ApplyMate <span className="gradient-text">AI</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto">
          <NavGroup label={t("nav.groupWorkflow")}>
            {workflowItems.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                label={t(item.labelKey)}
                badge={badgeFor(item)}
                active={activeNavId === item.id}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}
          </NavGroup>
          <NavGroup label={t("nav.groupManage")}>
            {manageItems.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                label={t(item.labelKey)}
                badge={badgeFor(item)}
                active={activeNavId === item.id}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}
          </NavGroup>
        </nav>

        {/* Preferences: theme + language */}
        <div className="px-3 mb-2 flex items-center justify-center gap-2 flex-wrap">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <span>{theme === "dark" ? "🌙" : "☀️"}</span>
            <span>{theme === "dark" ? t("theme.dark") : t("theme.light")}</span>
          </button>
          <LanguageSwitcher />
        </div>

        {/* Pricing hint */}
        <div
          className="mx-3 mb-2 px-3 py-2 rounded-lg text-center"
          style={{
            background: "rgba(59,130,246,0.04)",
            border: "1px dashed var(--border-mid)",
          }}
        >
          <p className="text-[11px] font-medium" style={{ color: "#93c5fd" }}>
            {t("nav.freeBetaPro")}
          </p>
        </div>

        {/* User card */}
        <div
          className="px-4 py-3 mx-3 mb-3 rounded-xl flex items-center gap-3"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
          >
            OB
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              Onur Balic
            </p>
            <p
              className="text-[11px] truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {t("nav.betaUser")}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="h-14 flex items-center px-5 lg:px-6 flex-shrink-0"
          style={{
            background: theme === "dark" ? "rgba(6, 13, 26, 0.8)" : "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <button
            className="mr-3 md:hidden text-lg"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <h1
            className="text-base font-bold truncate flex-1"
            style={{ color: "var(--text-primary)" }}
          >
            {resolvedTitle}
          </h1>
          {topBarRight}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

/* ── Helper: Nav group label ─────────────────────────────── */
function NavGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <p
        className="text-[10px] font-semibold tracking-widest uppercase px-3 pt-4 pb-1"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      {children}
    </>
  );
}

/* ── Helper: Sidebar link ────────────────────────────────── */
function SidebarLink({
  item,
  label,
  badge,
  active,
  onNavigate,
}: {
  item: (typeof navItems)[number];
  label: string;
  badge?: string;
  active: boolean;
  onNavigate: () => void;
}) {
  const className = `dash-nav-link ${active ? "dash-nav-link--active" : ""}`;

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      <span className="text-sm w-5 text-center">{item.icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
            color: "#fff",
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
