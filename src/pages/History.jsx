import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Calendar, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const MOCK_HISTORY = [
    {
        id: "ANL-9821",
        documentName: "Q3_Financial_Audit_Report.pdf",
        promptSummary: "Identify non-compliant operational risks and discrepancies in revenue recognition.",
        date: "Oct 24, 2025 - 14:30",
        status: "Completed",
        riskLevel: "High"
    },
    {
        id: "ANL-9820",
        documentName: "Employee_Handbook_2025_Draft.docx",
        promptSummary: "Analyze for compliance with updated Indian labor laws and remote work policies.",
        date: "Oct 22, 2025 - 09:15",
        status: "Completed",
        riskLevel: "Medium"
    },
    {
        id: "ANL-9819",
        documentName: "Vendor_Contract_TechCorp.pdf",
        promptSummary: "Highlight potential liability clauses and unusual penalty terms.",
        date: "Oct 18, 2025 - 16:45",
        status: "Completed",
        riskLevel: "Low"
    }
];

const History = () => {
    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Analysis History</h1>
                <p className="text-muted-foreground">View your past document audits and their complete results.</p>
            </div>

            <div className="grid gap-6">
                {MOCK_HISTORY.map((item) => (
                    <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md border-muted/60">
                        <div className="flex flex-col md:flex-row">
                            <div className="p-6 flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-primary" />
                                            <h3 className="font-semibold text-lg">{item.documentName}</h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Activity className="w-4 h-4" /> {item.id}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" /> {item.date}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2">
                                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                            {item.status}
                                        </Badge>
                                        <Badge variant="outline" className={
                                            item.riskLevel === 'High' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                item.riskLevel === 'Medium' ? "bg-warning/10 text-warning border-warning/20" :
                                                    "bg-primary/10 text-primary border-primary/20"
                                        }>
                                            {item.riskLevel} Risk
                                        </Badge>
                                    </div>
                                </div>

                                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                                    <p className="text-sm font-medium text-foreground/80 mb-1">Prompt Applied:</p>
                                    <p className="text-sm text-muted-foreground italic">"{item.promptSummary}"</p>
                                </div>
                            </div>

                            <div className="bg-muted/20 md:w-48 p-6 flex items-center justify-center border-t md:border-t-0 md:border-l border-border/50">
                                <Link to="/results" className="w-full">
                                    <Button variant="outline" className="w-full group">
                                        View Results
                                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default History;
