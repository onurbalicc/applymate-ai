"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { navItems, type NavId } from "@/app/lib/nav-items";

/* ─────────────────────────────────────────────────────────
   Shared Dashboard Layout
   Used by /dashboard, /profile, and /analyze.
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  /* Read persisted theme on mount */
  useEffect(() => {
    const saved = localStorage.getItem("applymate-theme");
    if (saved === "light") setTheme("light");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("applymate-theme", next);
  }

  const resolvedTitle =
    pageTitle ?? navItems.find((n) => n.id === activeNavId)?.label ?? "Dashboard";

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
          <NavGroup label="Workflow">
            {workflowItems.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                active={activeNavId === item.id}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}
          </NavGroup>
          <NavGroup label="Manage">
            {manageItems.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                active={activeNavId === item.id}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}
          </NavGroup>
        </nav>

        {/* Theme toggle */}
        <div className="px-3 mb-2 flex justify-center">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <span>{theme === "dark" ? "🌙" : "☀️"}</span>
            <span>{theme === "dark" ? "Dark" : "Light"}</span>
          </button>
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
            Free beta · Pro plans later
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
              Beta user
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
  active,
  onNavigate,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  onNavigate: () => void;
}) {
  const className = `dash-nav-link ${active ? "dash-nav-link--active" : ""}`;

  const inner = (
    <>
      <span className="text-sm w-5 text-center">{item.icon}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
            color: "#fff",
          }}
        >
          {item.badge}
        </span>
      )}
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={className} onClick={onNavigate}>
        {inner}
      </Link>
    );
  }

  return <button className={className}>{inner}</button>;
}
