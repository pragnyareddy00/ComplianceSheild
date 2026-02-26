import { ShieldCheck, AlertTriangle, FileDown, ArrowRight, Eye, BookOpen, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const severityColors = {
  High: "bg-danger/10 text-danger border-danger/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-success/10 text-success border-success/20"
};

const severityCounts = { High: 2, Medium: 1, Low: 1 };

const riskyItems = [
  { clause: "Clause 3.4", type: "Ambiguous Language", severity: "High" },
  { clause: "Clause 6.2", type: "Outdated Reference", severity: "Medium" },
  { clause: "Clause 8.1", type: "Missing Safeguard", severity: "High" },
  { clause: "Clause 11.3", type: "Vague Obligation", severity: "Low" }
];

const detailedExplanations = [
  {
    clause: "Clause 4.2",
    regulation: "GDPR Article 5(1)(e) — Storage Limitation",
    reason: "The clause does not specify a data retention period, which is a mandatory requirement under GDPR. Without a defined timeline, the organization may be retaining personal data indefinitely.",
    correction: "Add a clear retention period, e.g., 'Data shall be retained for a maximum of 36 months from the date of collection, after which it will be securely deleted.'"
  },
  {
    clause: "Clause 3.4",
    regulation: "General Contract Law — Certainty of Terms",
    reason: "The term 'reasonable efforts' is subjective and legally ambiguous. Courts may interpret this differently, leading to potential disputes.",
    correction: "Define 'reasonable efforts' explicitly or replace with 'commercially reasonable efforts as understood under [applicable jurisdiction].'"
  },
  {
    clause: "Clause 7.1",
    regulation: "GDPR Article 13 — Information to be Provided",
    reason: "Third-party data sharing is mentioned but recipients are not identified. Data subjects have the right to know who receives their data.",
    correction: "List all third-party recipients or categories of recipients and the purpose of each data transfer."
  }
];

const Results = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Analysis Results</h1>
        <p className="mt-2 text-muted-foreground">Review the compliance analysis findings below.</p>

        {/* Compliance Summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Overall Compliance Status</p>
            <div className="mt-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="font-display text-xl font-bold text-foreground">Partially Non-Compliant</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Overall Risk Level</p>
            <div className="mt-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-warning" />
              <span className="font-display text-xl font-bold text-foreground">Medium</span>
            </div>
          </div>
        </div>

        {/* Severity Overview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {["High", "Medium", "Low"].map((level) => (
            <div key={level} className={`rounded-xl border p-5 text-center ${severityColors[level]}`}>
              <p className="font-display text-3xl font-bold">{severityCounts[level]}</p>
              <p className="mt-1 text-sm font-medium">{level} Severity</p>
            </div>
          ))}
        </div>

        {/* Risky Clauses Summary */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-foreground">Highlighted Risky Clauses</h2>
          <div className="mt-4 space-y-3">
            {riskyItems.map((item) => (
              <div key={item.clause} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.clause}</p>
                  <p className="text-sm text-muted-foreground">{item.type}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityColors[item.severity]}`}>
                  {item.severity}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Explainability Breakdown (Merged Content) */}
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-foreground">Detailed Explainability</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Transparency is at the core of Compliance Shield. Below you can see exactly how and why each clause was flagged, with references to specific regulations.
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            {[
              { icon: Eye, label: "Clause Reference" },
              { icon: BookOpen, label: "Regulation Reference" },
              { icon: ShieldCheck, label: "Reason for Decision" },
              { icon: Lightbulb, label: "Suggested Correction" }
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center">
                <Icon className="mb-2 h-6 w-6 text-accent" />
                <p className="text-xs font-medium text-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {detailedExplanations.map((item) => (
              <motion.div
                key={item.clause}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {item.clause}
                  </span>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    {item.regulation}
                  </span>
                </div>
                <div className="mt-4 rounded-lg bg-muted p-4 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason for Flagging</p>
                  <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">{item.reason}</p>
                </div>
                <div className="mt-3 rounded-lg bg-success/5 p-4 border border-success/10">
                  <p className="text-xs font-medium text-success uppercase tracking-wider">Suggested Correction</p>
                  <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">{item.correction}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-6 text-center shadow-sm">
            <Lightbulb className="mx-auto mb-3 h-8 w-8 text-accent" />
            <h3 className="font-display text-lg font-semibold text-foreground">Built for Trust</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-foreground/80 leading-relaxed">
              Every AI decision is traceable. We provide full visibility into what was flagged, why it was flagged, and how to fix it — ensuring transparency and confidence in automated compliance analysis.
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-12 mb-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-sm"
          >
            Start New Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted shadow-sm">
            <FileDown className="h-4 w-4" />
            Download Report
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default Results;