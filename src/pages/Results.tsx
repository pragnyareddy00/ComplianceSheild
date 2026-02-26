import { ShieldCheck, AlertTriangle, FileDown, ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const severityColors = {
  High: "bg-danger/10 text-danger border-danger/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-success/10 text-success border-success/20",
};

const complianceGaps = [
  { clause: "Clause 4.2", issue: "Missing data retention policy as required under GDPR Article 5(1)(e)." },
  { clause: "Clause 7.1", issue: "Insufficient disclosure of third-party data sharing practices." },
  { clause: "Clause 9.5", issue: "Non-compliant termination clause — lacks mandatory notice period." },
];

const riskyItems = [
  { clause: "Clause 3.4", type: "Ambiguous Language", severity: "High" as const },
  { clause: "Clause 6.2", type: "Outdated Reference", severity: "Medium" as const },
  { clause: "Clause 8.1", type: "Missing Safeguard", severity: "High" as const },
  { clause: "Clause 11.3", type: "Vague Obligation", severity: "Low" as const },
];

const suggestions = [
  {
    clause: "Clause 4.2",
    reason: "No data retention timeline specified, violating GDPR Article 5(1)(e).",
    correction: "Add a specific data retention period (e.g., 'Personal data will be retained for no longer than 3 years from the date of collection').",
  },
  {
    clause: "Clause 3.4",
    reason: "Language is ambiguous — 'reasonable efforts' is not legally defined.",
    correction: "Replace 'reasonable efforts' with 'commercially reasonable efforts as defined under Section 2.1' or specify exact obligations.",
  },
];

const severityCounts = { High: 2, Medium: 1, Low: 1 };

const Results = () => (
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
        {(["High", "Medium", "Low"] as const).map((level) => (
          <div key={level} className={`rounded-xl border p-5 text-center ${severityColors[level]}`}>
            <p className="font-display text-3xl font-bold">{severityCounts[level]}</p>
            <p className="mt-1 text-sm font-medium">{level} Severity</p>
          </div>
        ))}
      </div>

      {/* Compliance Gap Report */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Compliance Gap Report</h2>
        <div className="mt-4 space-y-3">
          {complianceGaps.map((gap) => (
            <div key={gap.clause} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{gap.clause}</p>
              <p className="mt-1 text-sm text-muted-foreground">{gap.issue}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risky Clauses */}
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

      {/* Suggested Corrections */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Suggested Corrections</h2>
        <p className="mt-1 text-sm text-muted-foreground">Explainable AI recommendations for flagged clauses.</p>
        <div className="mt-4 space-y-4">
          {suggestions.map((s) => (
            <div key={s.clause} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground">{s.clause}</p>
              <div className="mt-2 rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">Reason</p>
                <p className="mt-0.5 text-sm text-foreground">{s.reason}</p>
              </div>
              <div className="mt-2 rounded-lg bg-success/5 p-3">
                <p className="text-xs font-medium text-success">Suggested Correction</p>
                <p className="mt-0.5 text-sm text-foreground">{s.correction}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
        >
          Start New Analysis
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
          <FileDown className="h-4 w-4" />
          Download Report
        </button>
      </div>

      <div className="mt-4 text-center">
        <Link to="/explainability" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          Learn how our AI reaches these conclusions
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  </div>
);

export default Results;
