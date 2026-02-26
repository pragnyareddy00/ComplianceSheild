import { Eye, BookOpen, ShieldCheck, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const explanations = [
  {
    clause: "Clause 4.2",
    regulation: "GDPR Article 5(1)(e) — Storage Limitation",
    reason: "The clause does not specify a data retention period, which is a mandatory requirement under GDPR. Without a defined timeline, the organization may be retaining personal data indefinitely.",
    correction: "Add a clear retention period, e.g., 'Data shall be retained for a maximum of 36 months from the date of collection, after which it will be securely deleted.'",
  },
  {
    clause: "Clause 3.4",
    regulation: "General Contract Law — Certainty of Terms",
    reason: "The term 'reasonable efforts' is subjective and legally ambiguous. Courts may interpret this differently, leading to potential disputes.",
    correction: "Define 'reasonable efforts' explicitly or replace with 'commercially reasonable efforts as understood under [applicable jurisdiction].'",
  },
  {
    clause: "Clause 7.1",
    regulation: "GDPR Article 13 — Information to be Provided",
    reason: "Third-party data sharing is mentioned but recipients are not identified. Data subjects have the right to know who receives their data.",
    correction: "List all third-party recipients or categories of recipients and the purpose of each data transfer.",
  },
];

const Explainability = () => (
  <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Explainability</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Transparency is at the core of Compliance Shield. Below you can see exactly how and why each clause was flagged, with references to specific regulations.
        </p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-4">
        {[
          { icon: Eye, label: "Clause Reference" },
          { icon: BookOpen, label: "Regulation Reference" },
          { icon: ShieldCheck, label: "Reason for Decision" },
          { icon: Lightbulb, label: "Suggested Correction" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center">
            <Icon className="mb-2 h-6 w-6 text-accent" />
            <p className="text-sm font-medium text-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {explanations.map((item) => (
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
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-xs font-medium text-muted-foreground">Reason for Flagging</p>
              <p className="mt-1 text-sm text-foreground">{item.reason}</p>
            </div>
            <div className="mt-3 rounded-lg bg-success/5 p-4">
              <p className="text-xs font-medium text-success">Suggested Correction</p>
              <p className="mt-1 text-sm text-foreground">{item.correction}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-accent/20 bg-accent/5 p-6 text-center">
        <Lightbulb className="mx-auto mb-3 h-8 w-8 text-accent" />
        <h3 className="font-display text-lg font-semibold text-foreground">Built for Trust</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Every AI decision is traceable. We provide full visibility into what was flagged, why it was flagged, and how to fix it — ensuring transparency and confidence in automated compliance analysis.
        </p>
      </div>
    </motion.div>
  </div>
);

export default Explainability;
