import { useState, useCallback } from "react";
import { Upload, FileText, File, ArrowRight, X, Lightbulb, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const UploadAnalyze = () => {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback((f) => {
    setFile({ name: f.name, type: f.type || f.name.split(".").pop() || "unknown" });
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const onSelect = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const fileIcon = file?.name.endsWith(".pdf") ? FileText : File;
  const FileIcon = fileIcon;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">Upload & Analyze</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
          Upload your legal or financial document and describe how you would like our agents to analyze it.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Upload & Prompt */}
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm">1</span>
                Document Upload
              </h2>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${dragOver ?
                    "border-primary bg-primary/5" :
                    "border-border bg-card hover:border-primary/20"}`
                }>

                <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-foreground">Drag & drop your document here</p>
                <p className="mt-1 text-sm text-muted-foreground">Supports PDF and Word (.docx) files</p>
                <label className="mt-6 cursor-pointer rounded-md bg-secondary px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/80">
                  Browse Files
                  <input type="file" accept=".pdf,.docx" onChange={onSelect} className="hidden" />
                </label>
              </div>

              {file && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm">2</span>
                Analysis Request
              </h2>
              <div className="space-y-3">
                <Label htmlFor="prompt" className="text-base text-foreground/80">
                  What should we look for in this document?
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g. Find all compliance risks related to the new taxation laws in India and summarize the key penalty clauses."
                  className="min-h-[150px] resize-none text-base p-4"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            </section>

            <button
              onClick={() => navigate("/results")}
              disabled={!file || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
              Start Analysis Workflow
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Right Column: Guidance Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-primary/20 shadow-sm bg-primary/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Prompt Guidance</CardTitle>
                </div>
                <CardDescription className="text-sm text-foreground/80">
                  Writing a clear request helps our agents give you exactly what you need.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">How to Structure Your Request</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong>State the goal clearly:</strong> Tell us precisely what you want to achieve with this document.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong>Pick the insights needed:</strong> Are you looking for a summary, a risk analysis, or identifying hidden clauses?</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong>Set the detail level:</strong> Do you need a high-level overview or an in-depth breakdown of every issue?</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 pt-4 border-t border-primary/10">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">Types of Analyses</h3>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="rounded-md bg-background px-3 py-2 border border-border">
                      <span className="font-medium text-foreground block mb-1">Risk Detection</span>
                      "Identify all legal and operational risks mentioned in this contract."
                    </div>
                    <div className="rounded-md bg-background px-3 py-2 border border-border">
                      <span className="font-medium text-foreground block mb-1">Compliance Check</span>
                      "Check if this policy complies with Indian labor regulations."
                    </div>
                    <div className="rounded-md bg-background px-3 py-2 border border-border">
                      <span className="font-medium text-foreground block mb-1">Executive Summary</span>
                      "Provide a simple, 3-paragraph summary of this financial report."
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default UploadAnalyze;