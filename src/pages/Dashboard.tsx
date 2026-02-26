import { Shield, FileText, AlertTriangle, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const stats = [
  { label: "Total Documents Analyzed", value: "127", icon: FileText, color: "bg-primary/10 text-primary" },
  { label: "Compliance Issues Found", value: "43", icon: AlertTriangle, color: "bg-warning/10 text-warning" },
  { label: "Risk Level Summary", value: "Medium", icon: BarChart3, color: "bg-accent/10 text-accent" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Dashboard = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Compliance Shield
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          AI-powered regulatory compliance analysis for legal and financial documents
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Leverage multi-agent AI to extract clauses, cross-reference regulations, and identify compliance gaps — all with full explainability.
        </p>
      </motion.div>

      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
        >
          Start New Analysis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
};

export default Dashboard;
