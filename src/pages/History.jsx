import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Calendar, Activity, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchUserHistory } from "@/lib/api";

const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) return;
            const { data, error } = await fetchUserHistory(user.id);
            if (data && !error) {
                setHistory(data);
            }
            setLoading(false);
        };

        loadHistory();
    }, [user]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Analysis History</h1>
                <p className="text-muted-foreground">View your past document audits and their complete results.</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : history.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 border-dashed border-muted">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-1">No analysis history found</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-6">
                        You haven&apos;t analyzed any documents yet. Upload a document to view its compliance history here.
                    </p>
                    <Link to="/upload">
                        <Button>Start New Analysis</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {history.map((item) => (
                        <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md border-muted/60">
                            <div className="flex flex-col md:flex-row">
                                <div className="p-6 flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-primary" />
                                                <h3 className="font-semibold text-lg">{item.document_name}</h3>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Activity className="w-4 h-4" /> {item.id.split('-')[0]}...
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" /> {formatDate(item.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2">
                                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                                {item.status}
                                            </Badge>
                                            {item.risk_level && (
                                                <Badge variant="outline" className={
                                                    item.risk_level === 'High' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                        item.risk_level === 'Medium' ? "bg-warning/10 text-warning border-warning/20" :
                                                            "bg-primary/10 text-primary border-primary/20"
                                                }>
                                                    {item.risk_level} Risk
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                                        <p className="text-sm font-medium text-foreground/80 mb-1">Prompt Applied:</p>
                                        <p className="text-sm text-muted-foreground italic">&quot;{item.summary || item.prompt_summary}&quot;</p>
                                    </div>
                                </div>

                                <div className="bg-muted/20 md:w-48 p-6 flex items-center justify-center border-t md:border-t-0 md:border-l border-border/50">
                                    <Link to={`/results?id=${item.id}`} className="w-full">
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
            )}
        </div>
    );
};

export default History;
