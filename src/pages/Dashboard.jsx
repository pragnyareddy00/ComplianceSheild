import { Shield, FileText, AlertTriangle, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchUserDashboardMetrics } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
};

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalAnalyzed: 0,
    complianceIssuesFound: 0,
    overallRiskLevel: "N/A"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!user) return;
      const { data, error } = await fetchUserDashboardMetrics(user.id);
      if (data && !error) {
        setMetrics(data);
      }
      setLoading(false);
    };

    loadMetrics();
  }, [user]);

  const stats = [
    { label: "Total Documents Analyzed", value: metrics.totalAnalyzed.toString(), icon: FileText, color: "bg-primary/10 text-primary" },
    { label: "Compliance Issues Found", value: metrics.complianceIssuesFound.toString(), icon: AlertTriangle, color: "bg-warning/10 text-warning" },
    { label: "Risk Level Summary", value: metrics.overallRiskLevel, icon: BarChart3, color: "bg-accent/10 text-accent" }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center">

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Compliance Shield
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name || "User"}. Review your latest AI-powered compliance analysis below.
        </p>
      </motion.div>

      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        {stats.map((stat, i) =>
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">

            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            {loading ? (
              <div className="mt-1 h-9 w-16 animate-pulse rounded bg-muted"></div>
            ) : (
              <p className="mt-1 font-display text-3xl font-bold text-foreground">{stat.value}</p>
            )}
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center">

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90">

          Start New Analysis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>);

};

export default Dashboard;