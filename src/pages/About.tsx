import { Shield, Bot, Scale, Eye } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Bot,
    title: "Multi-Agent AI Architecture",
    description: "Specialized agents for clause extraction, regulation retrieval, and verification work together for comprehensive analysis.",
  },
  {
    icon: Scale,
    title: "Regulatory Compliance",
    description: "Cross-reference documents against GDPR, financial regulations, and other legal frameworks automatically.",
  },
  {
    icon: Eye,
    title: "Full Explainability",
    description: "Every flagged clause comes with a transparent explanation, regulation reference, and actionable suggestion.",
  },
];

const About = () => (
  <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Shield className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">About Compliance Shield</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Compliance Shield is an AI-powered platform designed to automate regulatory compliance analysis for legal and financial documents. Built for legal professionals, compliance officers, and academic researchers.
        </p>
      </div>

      <div className="space-y-6">
        {features.map((f) => (
          <div key={f.title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <f.icon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">
          This project is developed as part of an academic research initiative exploring the application of multi-agent AI systems in regulatory compliance automation.
        </p>
      </div>
    </motion.div>
  </div>
);

export default About;
