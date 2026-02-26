import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const agents = [
  { name: "Clause Extraction Agent", description: "Extracting clauses from the document…" },
  { name: "Regulation Retrieval Agent", description: "Cross-referencing applicable regulations…" },
  { name: "Verification Agent", description: "Verifying compliance and detecting gaps…" },
];

const Processing = () => {
  const [completed, setCompleted] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timers = agents.map((_, i) =>
      setTimeout(() => setCompleted((c) => Math.max(c, i + 1)), (i + 1) * 1200)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const allDone = completed >= agents.length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Analyzing Document…</h1>
        <p className="mt-2 text-muted-foreground">
          Our multi-agent system is processing your document for thorough analysis.
        </p>

        <div className="mt-8 space-y-4">
          {agents.map((agent, i) => {
            const done = i < completed;
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`flex items-center gap-4 rounded-xl border p-5 transition-colors ${
                  done ? "border-success/30 bg-success/5" : "border-border bg-card"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
                ) : (
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-foreground">{agent.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {done ? "Completed" : agent.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Multiple specialized agents work together to improve accuracy and reliability of the analysis.
        </p>

        {allDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
            <button
              onClick={() => navigate("/results")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
            >
              View Results
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Processing;
