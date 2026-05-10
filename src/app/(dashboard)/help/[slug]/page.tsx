"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { HELP_ARTICLES } from "@/lib/help-articles";
import type { HelpWorkflow, HelpStep } from "@/lib/help-articles";


function Callout({ type, children }: { type: "tip" | "warning" | "note"; children: React.ReactNode }) {
  const styles = {
    tip: {
      bg: "oklch(0.97 0.03 150)",
      border: "oklch(0.75 0.15 150)",
      icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
      label: "Tip",
      color: "oklch(0.4 0.15 150)",
    },
    warning: {
      bg: "oklch(0.97 0.05 60)",
      border: "oklch(0.75 0.2 60)",
      icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
      label: "Warning",
      color: "oklch(0.45 0.2 60)",
    },
    note: {
      bg: "oklch(0.97 0.02 250)",
      border: "oklch(0.75 0.1 250)",
      icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
      label: "Note",
      color: "oklch(0.4 0.1 250)",
    },
  };
  const s = styles[type];
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 8, padding: "10px 14px",
      display: "flex", gap: 10, alignItems: "flex-start",
      marginTop: 10,
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1 }}>
        {s.icon.split("M").filter(Boolean).map((seg, i) => (
          <path key={i} d={"M" + seg} />
        ))}
      </svg>
      <div>
        <span style={{ fontWeight: 600, fontSize: 12, color: s.color }}>{s.label}: </span>
        <span style={{ fontSize: 12.5, color: "oklch(var(--ink-2))" }}>{children}</span>
      </div>
    </div>
  );
}

function StepCard({ step, index }: { step: HelpStep; index: number }) {
  return (
    <div style={{
      display: "flex", gap: 16, paddingBottom: 20,
      borderLeft: "2px solid oklch(var(--line))",
      paddingLeft: 20, marginLeft: 10,
      position: "relative",
    }}>
      {/* Step number bubble */}
      <div style={{
        position: "absolute", left: -13, top: 0,
        width: 24, height: 24, borderRadius: "50%",
        background: "oklch(var(--accent))",
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {index + 1}
      </div>
      <div style={{ paddingTop: 2, flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{step.title}</div>
        <p style={{ fontSize: 13.5, color: "oklch(var(--ink-2))", lineHeight: 1.6, margin: 0 }}>
          {step.description}
        </p>
        {step.tip && <Callout type="tip">{step.tip}</Callout>}
        {step.warning && <Callout type="warning">{step.warning}</Callout>}
        {step.note && <Callout type="note">{step.note}</Callout>}
      </div>
    </div>
  );
}

function WorkflowSection({ workflow, wfIndex }: { workflow: HelpWorkflow; wfIndex: number }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head">
        <div>
          <div className="flex items-center gap-2">
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px",
              background: "oklch(var(--accent) / 0.1)",
              color: "oklch(var(--accent))",
              borderRadius: 4,
            }}>
              WORKFLOW {wfIndex + 1}
            </span>
            <span className="card-h">{workflow.title}</span>
          </div>
          {workflow.description && (
            <p style={{ fontSize: 13, color: "oklch(var(--ink-3))", marginTop: 4 }}>
              {workflow.description}
            </p>
          )}
          {workflow.roles && workflow.roles.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {workflow.roles.map((r) => (
                <span key={r} style={{
                  fontSize: 10.5, padding: "1px 6px", borderRadius: 4,
                  background: "oklch(var(--bg-2))",
                  color: "oklch(var(--ink-3))",
                  border: "1px solid oklch(var(--line))",
                }}>{r}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card-body">
        <div style={{ paddingTop: 4 }}>
          {workflow.steps.map((step, si) => (
            <StepCard key={si} step={step} index={si} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HelpArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const article = HELP_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="max-w-[720px]">
        <Link href="/help" className="btn btn-ghost btn-sm mb-6">← Help Center</Link>
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: "40px 24px" }}>
            <p style={{ color: "oklch(var(--ink-3))", fontSize: 14 }}>Article not found.</p>
            <Link href="/help" className="btn btn-sm mt-4">Back to Help Center</Link>
          </div>
        </div>
      </div>
    );
  }

  const articleIndex = HELP_ARTICLES.findIndex((a) => a.slug === slug);
  const prev = articleIndex > 0 ? HELP_ARTICLES[articleIndex - 1] : null;
  const next = articleIndex < HELP_ARTICLES.length - 1 ? HELP_ARTICLES[articleIndex + 1] : null;

  return (
    <div className="max-w-[760px]">
      {/* Breadcrumb */}
      <Link href="/help" className="btn btn-ghost btn-sm mb-6">← Help Center</Link>

      {/* Article header */}
      <div className="flex items-start gap-4 mb-6">
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "oklch(var(--bg-2))",
          border: "1px solid oklch(var(--line))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, flexShrink: 0,
        }}>
          {article.icon}
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{article.title}</h1>
          <p style={{ fontSize: 14, color: "oklch(var(--ink-3))", marginBottom: 8 }}>{article.subtitle}</p>
          <div className="flex gap-1 flex-wrap">
            {article.roles.map((r) => (
              <span key={r} style={{
                fontSize: 10.5, padding: "2px 8px", borderRadius: 4,
                background: "oklch(var(--accent) / 0.08)",
                color: "oklch(var(--accent))",
                border: "1px solid oklch(var(--accent) / 0.2)",
                fontWeight: 500,
              }}>{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="card mb-4">
        <div className="card-body">
          <p style={{ fontSize: 14, color: "oklch(var(--ink-2))", lineHeight: 1.7, margin: 0 }}>
            {article.overview}
          </p>
        </div>
      </div>

      {/* Key Concepts */}
      {article.concepts && article.concepts.length > 0 && (
        <div className="card mb-4">
          <div className="card-head"><span className="card-h">Key Concepts</span></div>
          <div className="card-body">
            <dl style={{ margin: 0 }}>
              {article.concepts.map((c, i) => (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: "8px 16px",
                  paddingBottom: i < article.concepts!.length - 1 ? 12 : 0,
                  marginBottom: i < article.concepts!.length - 1 ? 12 : 0,
                  borderBottom: i < article.concepts!.length - 1 ? "1px solid oklch(var(--line))" : "none",
                }}>
                  <dt style={{ fontWeight: 600, fontSize: 13, color: "oklch(var(--ink-1))" }}>
                    {c.term}
                  </dt>
                  <dd style={{ fontSize: 13, color: "oklch(var(--ink-2))", lineHeight: 1.6, margin: 0 }}>
                    {c.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* Workflows */}
      {article.workflows.map((wf, wi) => (
        <WorkflowSection key={wi} workflow={wf} wfIndex={wi} />
      ))}

      {/* FAQs */}
      {article.faqs && article.faqs.length > 0 && (
        <div className="card mb-4">
          <div className="card-head"><span className="card-h">Frequently Asked Questions</span></div>
          <div className="card-body">
            {article.faqs.map((faq, i) => (
              <div key={i} style={{
                paddingBottom: i < article.faqs!.length - 1 ? 16 : 0,
                marginBottom: i < article.faqs!.length - 1 ? 16 : 0,
                borderBottom: i < article.faqs!.length - 1 ? "1px solid oklch(var(--line))" : "none",
              }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>
                  Q: {faq.q}
                </div>
                <p style={{ fontSize: 13, color: "oklch(var(--ink-2))", lineHeight: 1.6, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div className="flex gap-3 mt-6" style={{ borderTop: "1px solid oklch(var(--line))", paddingTop: 20 }}>
        {prev ? (
          <Link href={`/help/${prev.slug}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
            ← {prev.title}
          </Link>
        ) : <div style={{ flex: 1 }} />}
        {next ? (
          <Link href={`/help/${next.slug}`} className="btn btn-ghost btn-sm" style={{ flex: 1, textAlign: "right", justifyContent: "flex-end" }}>
            {next.title} →
          </Link>
        ) : <div style={{ flex: 1 }} />}
      </div>
    </div>
  );
}
