import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, BookOpen, AlertTriangle, FileSearch, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const options = [
{
  id: "full",
  icon: ShieldCheck,
  title: "Full Compliance Check",
  description: "Analyze the entire document for overall regulatory compliance."
},
{
  id: "regulation",
  icon: BookOpen,
  title: "Regulation-Specific Analysis",
  description: "Analyze the document against a specific legal or regulatory framework."
},
{
  id: "risk",
  icon: AlertTriangle,
  title: "Weak Points & Risk Detection",
  description: "Identify high-risk, vague, or outdated clauses in the document."
},
{
  id: "extraction",
  icon: FileSearch,
  title: "Information Extraction",
  description: "Extract important legal and financial information from the document."
}];


const AnalysisOptions = () => {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">What would you like to analyze?</h1>
        <p className="mt-2 text-muted-foreground">Select an analysis type to proceed.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`group relative flex flex-col items-start rounded-xl border-2 p-6 text-left transition-all ${
                isSelected ?
                "border-accent bg-accent/5 shadow-md" :
                "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm"}`
                }>
                
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                  isSelected ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`
                  }>
                  
                  <opt.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">{opt.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{opt.description}</p>
                {isSelected &&
                <motion.div
                  layoutId="selected-check"
                  className="absolute right-4 top-4 h-3 w-3 rounded-full bg-accent" />

                }
              </button>);

          })}
        </div>

        <div className="mt-8 text-center">
          <button
            disabled={!selected}
            onClick={() => navigate(`/processing`)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            
            Proceed
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>);

};

export default AnalysisOptions;