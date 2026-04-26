import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, FileDown, ArrowRight, Eye, BookOpen, Lightbulb, Send, Loader2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchAnalysisById, updateAnalysis } from "@/lib/api";
import html2pdf from 'html2pdf.js';
const severityColors = {
  High: "bg-danger/10 text-danger border-danger/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-success/10 text-success border-success/20"
};



const Results = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const idFromUrl = queryParams.get("id");

  const [reportData, setReportData] = useState(location.state?.report || null);
  const [isFetching, setIsFetching] = useState(!reportData && !!idFromUrl);
  
  const analysisId = location.state?.analysisId || idFromUrl;

  useEffect(() => {
    if (!reportData && idFromUrl) {
      const getAnalysis = async () => {
        const { data, error } = await fetchAnalysisById(idFromUrl);
        if (data && !error && data.report_data) {
          setReportData(data.report_data);
        }
        setIsFetching(false);
      };
      getAnalysis();
    }
  }, [idFromUrl, reportData]);

  const summaryStatus = reportData?.summary_card?.status || "Compliant";

  const feed = reportData?.compliance_feed || [];
  const riskyItems = feed.filter(f => f.risk !== 'Compliant').map((f, i) => ({
    clause: f.clause?.substring(0, 40) + "..." || `Item ${i}`,
    type: "Compliance Issue",
    severity: f.risk || (f.issue?.includes("Remediated") ? "Low" : "High")
  }));

  const detailedExplanations = feed.map((f, i) => ({
    clause: f.clause?.substring(0, 60) + "..." || `Item ${i}`,
    regulation: "Identified by Compliance Engine",
    reason: f.issue || "Flagged manually",
    correction: f.risk === 'Compliant' ? "None needed - Meets regulatory standards." : (f.fix || "Awaiting drafting remediation"),
    discoveryMethod: f.discovery_method,
    location: f.location,
    risk: f.risk
  }));

  const severityCounts = {
    High: riskyItems.filter(i => i.severity === 'High').length,
    Medium: riskyItems.filter(i => i.severity === 'Medium').length,
    Low: riskyItems.filter(i => i.severity === 'Low').length
  };

  const getOverallRiskLevel = (counts) => {
    const { High, Medium, Low } = counts;
    if (High === 0 && Medium === 0 && Low === 0) return "Low";
    if (High >= Medium && High >= Low) return "High";
    if (Medium >= High && Medium >= Low) return "Medium";
    return "Low";
  };

  const riskLevel = getOverallRiskLevel(severityCounts);

  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      content: "I've completed the compliance analysis based on Indian regulations (DPDPA 2023, Indian Contract Act).\n\nDo you have any questions about this analysis or the document?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [messagesRemaining, setMessagesRemaining] = useState(15);
  const [isRevising, setIsRevising] = useState(false);

  useEffect(() => {
      if (reportData) {
          if (reportData.chatHistory) setChatHistory(reportData.chatHistory);
          if (reportData.messagesRemaining !== undefined || reportData.revisionsRemaining !== undefined) {
              setMessagesRemaining(reportData.messagesRemaining ?? reportData.revisionsRemaining);
          }
      }
  }, [reportData]);

  const handleSendPrompt = async () => {
    if (!inputValue.trim() || messagesRemaining <= 0 || !reportData || isRevising) return;
    
    setIsRevising(true);
    const userMessage = { role: "user", content: inputValue.trim() };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setInputValue("");
    
    try {
      const response = await fetch("http://127.0.0.1:8088/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_document: reportData.raw_document || "",
          prompt: userMessage.content,
          chat_history: chatHistory,
          analysis_report: reportData.compliance_feed || []
        })
      });

      if (response.ok) {
        const { reply } = await response.json();
        const updatedHistory = [...newHistory, { role: "assistant", content: reply }];
        const newMessagesCount = messagesRemaining - 1;
        
        setChatHistory(updatedHistory);
        setMessagesRemaining(newMessagesCount);
        
        if (analysisId) {
            const updatedReportData = { ...reportData, chatHistory: updatedHistory, messagesRemaining: newMessagesCount };
            setReportData(updatedReportData);
            await updateAnalysis(analysisId, { report_data: updatedReportData });
        }
      } else {
        alert("Failed to get revision from AI.");
        setChatHistory(chatHistory);
      }
    } catch (error) {
      console.error(error);
      alert("Error getting revision.");
      setChatHistory(chatHistory);
    } finally {
      setIsRevising(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const actionsDiv = document.getElementById('report-actions');
    if (actionsDiv) actionsDiv.style.display = 'none';

    const opt = {
      margin:       10,
      filename:     `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const generatePdf = typeof html2pdf === "function" ? html2pdf : (html2pdf?.default || window.html2pdf);
    
    if (typeof generatePdf !== "function") {
        console.error("html2pdf is not loaded correctly");
        alert("Unable to generate PDF at this time.");
        if (actionsDiv) actionsDiv.style.display = 'flex';
        return;
    }

    generatePdf().set(opt).from(element).save().then(() => {
        if (actionsDiv) actionsDiv.style.display = 'flex';
    }).catch((err) => {
        console.error("PDF generation failed", err);
        if (actionsDiv) actionsDiv.style.display = 'flex';
    });
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Retrieving your analysis history...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center space-y-6 text-center px-4">
        <div className="rounded-full bg-primary/10 p-4">
          <ShieldCheck className="h-12 w-12 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">No Analysis Found</h2>
        <p className="text-muted-foreground">
          It looks like you haven't uploaded a document or selected an analysis yet. You can start a new analysis or check your previous reports in history.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-sm"
          >
            Start New Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            View History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-8 lg:grid-cols-3">

        {/* Left Column: Analysis Results */}
        <div className="lg:col-span-2" id="report-content">
          <h1 className="font-display text-3xl font-bold text-foreground">Analysis Results</h1>
          <p className="mt-2 text-muted-foreground">Review the compliance analysis findings against Indian law below.</p>

          {/* Compliance Summary */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-sm font-medium text-muted-foreground">Overall Compliance Status</p>
              <div className="mt-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="font-display text-xl font-bold text-foreground">{summaryStatus}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-sm font-medium text-muted-foreground">Overall Risk Level</p>
              <div className="mt-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-warning" />
                <span className="font-display text-xl font-bold text-foreground">{riskLevel}</span>
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
          {riskyItems.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold text-foreground">Highlighted Risky Clauses</h2>
              <div className="mt-4 space-y-3">
                {riskyItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
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
          ) : (
            <section className="mt-10">
              <div className="rounded-xl border border-success/20 bg-success/5 p-8 text-center shadow-sm">
                <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-success" />
                <h3 className="font-display text-2xl font-bold text-success">Document is Fully Compliant</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm text-foreground/80 leading-relaxed">
                  Excellent! The analyzed document strictly adheres to Indian laws, including the DPDP Act 2023. No critical legal risks were detected.
                </p>
              </div>
            </section>
          )}

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
              {detailedExplanations.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {item.clause}
                    </span>
                    {item.location && (item.location.page || item.location.line) && (
                      <span className="rounded-full bg-blue-100 text-blue-800 border border-blue-200 shadow-sm dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-3 py-1 text-xs font-bold flex items-center gap-1.5 translate-y-[-1px]">
                        📍 {item.location.page ? `Page ${item.location.page}` : ''}
                        {item.location.page && item.location.line ? ' | ' : ''}
                        {item.location.line || ''}
                      </span>
                    )}
                    {item.discoveryMethod === "autonomous_discovery" && (
                      <span className="rounded-full bg-warning/20 border border-warning/30 px-3 py-1 text-xs font-semibold text-warning animate-pulse flex items-center gap-1 shadow-sm">
                        <AlertTriangle className="h-3 w-3" />
                        Autonomously Detected Risk
                      </span>
                    )}
                    <span className="rounded-full bg-accent/10 py-1 px-3 text-xs font-semibold text-accent border border-accent/20 shadow-sm">
                      Identified by Compliance Engine
                    </span>
                  </div>
                  <div className={`mt-4 rounded-lg p-4 border ${item.risk === 'Compliant' ? 'bg-success/5 border-success/10' : 'bg-muted border-border/50'}`}>
                    <p className={`text-xs font-medium uppercase tracking-wider ${item.risk === 'Compliant' ? 'text-success' : 'text-muted-foreground'}`}>
                      {item.risk === 'Compliant' ? 'Reason for Compliance' : 'Reason for Flagging'}
                    </p>
                    <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{item.reason}</p>
                    {item.location && item.location.snippet && (
                      <div className={`mt-3 border-l-2 pl-3 ${item.risk === 'Compliant' ? 'border-success/40' : 'border-primary/40'}`}>
                        <p className="text-xs text-muted-foreground italic tracking-wide">
                          "{item.location.snippet}"
                        </p>
                      </div>
                    )}
                  </div>
                  <div className={`mt-3 rounded-lg p-4 border ${item.risk === 'Compliant' ? 'bg-success/10 border-success/20' : 'bg-success/5 border-success/10'}`}>
                    <p className="text-xs font-medium text-success uppercase tracking-wider">
                      {item.risk === 'Compliant' ? 'Compliance Status' : 'Suggested Correction'}
                    </p>
                    <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{item.correction}</p>
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
          <div id="report-actions" className="mt-12 mb-8 flex flex-wrap items-center justify-start gap-4">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-sm"
            >
              Start New Analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button 
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted shadow-sm"
            >
              <FileDown className="h-4 w-4" />
              Download Report
            </button>
          </div>
        </div>

        {/* Right Column: Follow-up Prompt */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-foreground">AI Legal Assistant</h2>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
                Messages left: {messagesRemaining}/15
              </span>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
              {chatHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`rounded-xl p-4 text-sm ${
                    msg.role === 'assistant' 
                      ? 'bg-muted text-foreground' 
                      : 'bg-primary/10 text-primary border border-primary/20 ml-6'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>

            {/* Prompt Input */}
            <div className="relative mt-auto">
              <textarea
                className="w-full resize-none rounded-xl border border-input bg-background pl-4 pr-12 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                placeholder={messagesRemaining > 0 ? "Ask a question about the document..." : "No messages remaining."}
                rows={3}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={messagesRemaining <= 0}
              />
              <button 
                onClick={handleSendPrompt}
                disabled={messagesRemaining <= 0 || !inputValue.trim() || isRevising}
                className="absolute bottom-3 right-3 rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRevising ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Results;