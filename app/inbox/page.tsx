"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";
import {
  inboxMessages,
  inboxTypeMeta,
  type InboxType,
} from "@/app/lib/mock-data";
import { useI18n } from "@/app/lib/i18n";
import type { TKey } from "@/app/lib/translations";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Inbox
   Application reply center: replies, follow-ups, interviews.
   Nothing is ever sent without user approval.
   ───────────────────────────────────────────────────────── */

type Filter = "all" | InboxType;

const followUpRuleKeys: TKey[] = ["inbox.rule1", "inbox.rule2", "inbox.rule3", "inbox.rule4"];

const hintKeys: Record<InboxType, TKey> = {
  interview: "inbox.hintInterview",
  "follow-up": "inbox.hintFollowUp",
  rejection: "inbox.hintRejection",
  new: "inbox.hintNew",
  reply: "inbox.hintDefault",
};

/* Initial selection: first message with a prepared draft */
const initialSelectedId = inboxMessages.find((m) => m.suggestedReply)?.id ?? inboxMessages[0].id;

export default function InboxPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<number>(initialSelectedId);
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const visible = inboxMessages.filter((m) => filter === "all" || m.type === filter);
  const selected = inboxMessages.find((m) => m.id === selectedId) ?? null;

  function handleCopy() {
    if (!selected?.suggestedReply) return;
    navigator.clipboard.writeText(selected.suggestedReply).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const summary: { labelKey: TKey; value: number; filterValue: Filter; color: string }[] = [
    { labelKey: "inbox.repliesPending", value: count("reply"), filterValue: "reply", color: "#fde047" },
    { labelKey: "inbox.followUpsDue", value: count("follow-up"), filterValue: "follow-up", color: "#fb923c" },
    { labelKey: "inbox.interviews", value: count("interview"), filterValue: "interview", color: "#4ade80" },
    { labelKey: "inbox.archived", value: count("rejection"), filterValue: "rejection", color: "var(--text-muted)" },
  ];

  return (
    <DashboardLayout
      activeNavId="inbox"
      topBarRight={
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}
        >
          {inboxMessages.filter((m) => m.unread).length} {t("inbox.unread")}
        </span>
      }
    >
      <div className="max-w-[1120px] mx-auto flex flex-col gap-5">

        {/* ── Page intro ─────────────────── */}
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {t("inbox.intro")}
        </p>

        {/* ── Trust note ─────────────────── */}
        <div
          className="rounded-lg px-4 py-2.5 text-center text-[12px]"
          style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          🔒 <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("inbox.neverSends")}</span>{" "}
          {t("inbox.draftsPrepared")}
        </div>

        {/* ── Summary cards (clickable filters) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.map((s) => {
            const active = filter === s.filterValue;
            return (
              <button
                key={s.labelKey}
                className="dash-stat-card text-left cursor-pointer"
                onClick={() => setFilter(active ? "all" : s.filterValue)}
                style={{
                  borderColor: active ? "rgba(59,130,246,0.4)" : undefined,
                  background: active ? "var(--blue-dim)" : undefined,
                }}
              >
                <p className="text-lg font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t(s.labelKey)}</p>
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
                {t("inbox.priority")}
                {filter !== "all" && (
                  <button
                    className="ml-2 text-[11px] font-medium"
                    style={{ color: "#93c5fd" }}
                    onClick={() => setFilter("all")}
                  >
                    {t("inbox.clearFilter")}
                  </button>
                )}
              </h2>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {t("inbox.sorted")}
              </span>
            </div>

            <div className="dash-panel">
              {visible.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                  {t("inbox.empty")}
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
                          {t(meta.labelKey)}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}
                        >
                          → {t(msg.actionKey)}
                        </span>
                      </div>

                      {msg.jobIndex !== undefined && (
                        <div
                          className="mt-2 pt-2 border-t flex items-center gap-1.5 text-[11px]"
                          style={{ borderColor: "var(--border-subtle)" }}
                        >
                          <span style={{ color: "var(--text-muted)" }}>{t("inbox.relatedPackage")}:</span>
                          <Link
                            href={`/review?job=${msg.jobIndex}`}
                            className="font-semibold hover:underline flex items-center"
                            style={{ color: "#60a5fa" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t("inbox.viewPackage")} →
                          </Link>
                        </div>
                      )}
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
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{t("inbox.suggestedAction")}</h2>
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
                        {t(inboxTypeMeta[selected.type].labelKey)}
                      </span>
                    </div>

                    {selected.jobIndex !== undefined && (
                      <div
                        className="rounded-lg p-2.5 mb-3 flex items-center justify-between text-[11px]"
                        style={{ background: "rgba(59,130,246,0.03)", border: "1px solid rgba(59,130,246,0.12)" }}
                      >
                        <span style={{ color: "var(--text-secondary)" }}>💼 {t("inbox.relatedPackage")}</span>
                        <Link
                          href={`/review?job=${selected.jobIndex}`}
                          className="font-semibold hover:underline"
                          style={{ color: "#60a5fa" }}
                        >
                          {t("inbox.viewPackage")} →
                        </Link>
                      </div>
                    )}

                    {/* Contextual Action Block */}
                    {selected.type !== "new" && (
                      <div
                        className="rounded-lg p-3.5 mb-3 flex flex-col gap-2"
                        style={{
                          background: selected.type === "interview"
                            ? "rgba(34,197,94,0.04)"
                            : selected.type === "rejection"
                            ? "var(--bg-overlay)"
                            : "rgba(250,204,21,0.03)",
                          border: `1px solid ${
                            selected.type === "interview"
                              ? "rgba(34,197,94,0.15)"
                              : selected.type === "rejection"
                              ? "var(--border-subtle)"
                              : "rgba(250,204,21,0.15)"
                          }`,
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                            ⚡ {t("inbox.recommendedStep")}
                          </span>
                        </div>
                        <div>
                          <p className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>
                            {selected.type === "interview" && t("inbox.actionPrepInterview")}
                            {(selected.type === "reply" || selected.type === "follow-up") && t("inbox.actionDraftReply")}
                            {selected.type === "rejection" && t("inbox.actionReviewFeedback")}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {selected.type === "interview" && t("inbox.actionPrepInterviewSub")}
                            {(selected.type === "reply" || selected.type === "follow-up") && t("inbox.actionDraftReplySub")}
                            {selected.type === "rejection" && t("inbox.actionReviewFeedbackSub")}
                          </p>
                        </div>
                      </div>
                    )}

                    {selected.suggestedReply ? (
                      <>
                        <div
                          className="rounded-lg p-3.5 mb-3"
                          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                            {t("inbox.draftLabel")}
                          </p>
                          <p className="text-[12px] leading-[1.7] whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                            {selected.suggestedReply}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="dash-btn dash-btn--primary text-[12px]" onClick={handleCopy}>
                            {copied ? t("inbox.copied") : t("inbox.copyDraft")}
                          </button>
                          <button className="dash-btn dash-btn--outline text-[12px]">{t("inbox.editDraft")}</button>
                        </div>
                        <p className="text-[10px] mt-3" style={{ color: "var(--text-muted)" }}>
                          {t("inbox.sendingLater")}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                          {t(hintKeys[selected.type])}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selected.type === "interview" && selected.jobIndex !== undefined ? (
                            <Link href={`/review?job=${selected.jobIndex}`} className="dash-btn dash-btn--primary text-[12px]">
                              {t("inbox.openPrep")}
                            </Link>
                          ) : selected.type === "rejection" && selected.jobIndex !== undefined ? (
                            <Link href={`/review?job=${selected.jobIndex}`} className="dash-btn dash-btn--outline text-[12px]">
                              🔍 {t("inbox.actionReviewFeedback")}
                            </Link>
                          ) : (
                            <button className="dash-btn dash-btn--outline text-[12px]">
                              → {t(selected.actionKey)}
                            </button>
                          )}
                          <button className="dash-btn dash-btn--ghost text-[12px]">{t("inbox.archiveBtn")}</button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-[12px] py-4 text-center" style={{ color: "var(--text-muted)" }}>
                    {t("inbox.selectMessage")}
                  </p>
                )}
              </div>
            </section>

            {/* Follow-up rules */}
            <section>
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{t("inbox.rulesTitle")}</h2>
              <div className="dash-panel p-4">
                <ul className="flex flex-col gap-2.5 mb-3">
                  {followUpRuleKeys.map((key) => (
                    <li key={key} className="flex items-start gap-2.5 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5"
                        style={{ background: "var(--blue-dim)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}
                      >
                        ⚙
                      </span>
                      {t(key)}
                    </li>
                  ))}
                </ul>
                <button className="dash-btn dash-btn--ghost text-[12px]">{t("inbox.editRules")}</button>
              </div>
            </section>

            {/* Soft Pro hint */}
            <div
              className="rounded-xl p-3.5"
              style={{ background: "rgba(59,130,246,0.04)", border: "1px dashed var(--border-mid)" }}
            >
              <p className="text-[12px] font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>
                {t("inbox.proTitle")}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {t("inbox.proDesc")}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-center pb-4" style={{ color: "var(--text-muted)" }}>
          {t("inbox.demoNote")}
        </p>
      </div>
    </DashboardLayout>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function count(type: InboxType) {
  return inboxMessages.filter((m) => m.type === type).length;
}
