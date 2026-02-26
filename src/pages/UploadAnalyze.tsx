import { useState, useCallback } from "react";
import { Upload, FileText, File, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const UploadAnalyze = () => {
  const [file, setFile] = useState<{ name: string; type: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback((f: File) => {
    setFile({ name: f.name, type: f.type || f.name.split(".").pop() || "unknown" });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const fileIcon = file?.name.endsWith(".pdf") ? FileText : File;
  const FileIcon = fileIcon;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Upload & Analyze</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a legal or financial document to begin compliance analysis.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border bg-card hover:border-muted-foreground/30"
          }`}
        >
          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">Drag & drop your document here</p>
          <p className="mt-1 text-sm text-muted-foreground">Supports PDF and Word (.docx) files</p>
          <label className="mt-5 cursor-pointer rounded-lg bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
            Browse Files
            <input type="file" accept=".pdf,.docx" onChange={onSelect} className="hidden" />
          </label>
        </div>

        {file && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 overflow-hidden rounded-xl border border-border bg-card p-4"
          >
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
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => navigate("/analysis-options")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Proceed to Analysis Options
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadAnalyze;
