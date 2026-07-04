"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";
import {
  inboxMessages,
  inboxTypeMeta,
  suggestedReply,
  followUpRules,
  type InboxType,
} from "@/app/lib/mock-data";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Inbox
   Application reply center: replies, follow-ups, interviews.
   Nothing is ever sent without user approval.
   ───────────────────────────────────────────────────────── */

type Filter = "all" | InboxType;

export default function InboxPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<number>(suggestedReply.forMessageId);
  const [copied, setCopied] = useState(false);

  const visible = inboxMessages.filter((m) => filter === "all" || m.type === filter);
  const selected = inboxMessages.find((m) => m.id === selectedId) ?? null;

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const summary: { label: string; value: number; filterValue: Filter; color: string }[] = [
    { label: "Replies pending", value: count("reply"), filterValue: "reply", color: "#fde047" },
    { label: "Follow-ups due", value: count("follow-up"), filterValue: "follow-up", color: "#fb923c" },
    { label: "Interviews scheduled", value: count("interview"), filterValue: "interview", color: "#4ade80" },
    { label: "Archived rejections", value: count("rejection"), filterValue: "rejection", color: "var(--text-muted)" },
  ];

  return (
    <DashboardLayout
      activeNavId="inbox"
      pageTitle="Inbox"
      topBarRight={
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}
        >
          {inboxMessages.filter((m) => m.unread).length} unread
        </span>
      }
    >
      <div className="max-w-[1120px] mx-auto flex flex-col gap-5">

        {/* ── Page intro ─────────────────── */}
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Replies, interview invitations, and follow-ups for your tracked applications — triaged automatically.
        </p>

        {/* ── Trust note ─────────────────── */}
        <div
          className="rounded-lg px-4 py-2.5 text-center text-[12px]"
          style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          🔒 <span className="font-semibold" style={{ color: "var(--text-primary)" }}>ApplyMate never sends emails without your approval.</span>{" "}
          Drafts are prepared — you decide what goes out.
        </div>

        {/* ── Summary cards (clickable filters) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.map((s) => {
            const active = filter === s.filterValue;
            return (
              <button
                key={s.label}
                className="dash-stat-card text-left cursor-pointer"
                onClick={() => setFilter(active ? "all" : s.filterValue)}
                style={{
                  borderColor: active ? "rgba(59,130,246,0.4)" : undefined,
                  background: active ? "var(--blue-dim)" : undefined,
                }}
              >
                <p className="text-lg font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </button>
            );
          })}
        </div>

        {/* ── Message list + reply panel ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

          {/* Priority inbox */}
          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Priority Inbox
                {filter !== "all" && (
                  <button
                    className="ml-2 text-[11px] font-medium"
                    style={{ color: "#93c5fd" }}
                    onClick={() => setFilter("all")}
                  >
                    · Clear filter ✕
                  </button>
                )}
              </h2>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Sorted by urgency
              </span>
            </div>

            <div className="dash-panel">
              {visible.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                  No messages in this category yet.
                </p>
              )}
              {visible.map((msg, i) => {
                const meta = inboxTypeMeta[msg.type];
                const isSelected = msg.id === selectedId;
                return (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedId(msg.id)}
                    className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors"
                    style={{
                      borderBottom: i < visible.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      background: isSelected ? "var(--bg-raised)" : "transparent",
                      opacity: msg.type === "rejection" ? 0.65 : 1,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: msg.unread ? "#60a5fa" : "var(--border-mid)" }}
                      aria-label={msg.unread ? "Unread" : "Read"}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p
                          className={`text-[13px] truncate ${msg.unread ? "font-bold" : "font-medium"}`}
                          style={{ color: "var(--text-primary)" }}
                        >
                          {msg.subject}
                        </p>
                        <span className="text-[10px] flex-shrink-0 ml-auto" style={{ color: "var(--text-muted)" }}>
                          {msg.time}
                        </span>
                      </div>
                      <p className="text-[11px] truncate mb-1.5" style={{ color: "var(--text-muted)" }}>
                        {msg.from} · {msg.role}
                      </p>
                      <p className="text-[12px] leading-relaxed line-clamp-2 mb-2" style={{ color: "var(--text-secondary)" }}>
                        {msg.preview}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}
                        >
                          → {msg.suggestedAction}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right column: suggested reply + rules */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Suggested reply / action card */}
            <section>
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Suggested Action</h2>
              <div className="dash-panel p-4">
                {selected ? (
                  <>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
                      >
                        {selected.company[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {selected.company}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{selected.role}</p>
                      </div>
                      <span
                        className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: inboxTypeMeta[selected.type].bg,
                          color: inboxTypeMeta[selected.type].color,
                          border: `1px solid ${inboxTypeMeta[selected.type].border}`,
                        }}
                      >
                        {inboxTypeMeta[selected.type].label}
                      </span>
                    </div>

                    {selected.id === suggestedReply.forMessageId ? (
                      <>
                        <div
                          className="rounded-lg p-3.5 mb-3"
                          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                            ✉️ Draft reply · prepared for your review
                          </p>
                          <p className="text-[12px] leading-[1.7] whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                            {suggestedReply.body}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="dash-btn dash-btn--primary text-[12px]" onClick={handleCopy}>
                            {copied ? "✓ Copied" : "📋 Copy draft"}
                          </button>
                          <button className="dash-btn dash-btn--outline text-[12px]">✏️ Edit draft</button>
                        </div>
                        <p className="text-[10px] mt-3" style={{ color: "var(--text-muted)" }}>
                          🔒 Sending from ApplyMate is coming later — for now, copy the draft into your email client.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                          {actionHint(selected.type)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selected.type === "interview" ? (
                            <Link href="/review?job=2" className="dash-btn dash-btn--primary text-[12px]">
                              🎤 Open interview prep
                            </Link>
                          ) : (
                            <button className="dash-btn dash-btn--outline text-[12px]">
                              → {selected.suggestedAction}
                            </button>
                          )}
                          <button className="dash-btn dash-btn--ghost text-[12px]">🗂 Archive</button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-[12px] py-4 text-center" style={{ color: "var(--text-muted)" }}>
                    Select a message to see the suggested action.
                  </p>
                )}
              </div>
            </section>

            {/* Follow-up rules */}
            <section>
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Follow-up Rules</h2>
              <div className="dash-panel p-4">
                <ul className="flex flex-col gap-2.5 mb-3">
                  {followUpRules.map((rule) => (
                    <li key={rule} className="flex items-start gap-2.5 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5"
                        style={{ background: "var(--blue-dim)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}
                      >
                        ⚙
                      </span>
                      {rule}
                    </li>
                  ))}
                </ul>
                <button className="dash-btn dash-btn--ghost text-[12px]">✏️ Edit rules</button>
              </div>
            </section>

            {/* Soft Pro hint */}
            <div
              className="rounded-xl p-3.5"
              style={{ background: "rgba(59,130,246,0.04)", border: "1px dashed var(--border-mid)" }}
            >
              <p className="text-[12px] font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>
                ⚡ Coming with Pro
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Automatic email reply detection and one-click approved follow-ups — always with your sign-off.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-center pb-4" style={{ color: "var(--text-muted)" }}>
          This is a demo preview with mock messages. Real email integration is coming later.
        </p>
      </div>
    </DashboardLayout>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function count(type: InboxType) {
  return inboxMessages.filter((m) => m.type === type).length;
}

function actionHint(type: InboxType): string {
  switch (type) {
    case "interview":
      return "You have an interview scheduled. ApplyMate prepared likely questions and talking points based on the job requirements.";
    case "follow-up":
      return "No reply after 7 days. A polite follow-up draft is ready — review it and send it from your email client when you're ready.";
    case "rejection":
      return "This application was rejected. It has been archived automatically and follow-ups were cancelled. No action needed.";
    case "new":
      return "A new email was detected for a tracked application. Classify it so ApplyMate files it under the right application.";
    default:
      return "Review the message and choose the suggested action when you're ready.";
  }
}
