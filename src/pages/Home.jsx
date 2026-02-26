import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const Home = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Header simply with Login/SignUp, no full navbar */}
            <header className="px-6 py-4 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                        <Shield className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="font-display text-2xl font-bold tracking-tight text-foreground">
                        Compliance Sheild
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login">
                        <Button variant="ghost" className="font-medium">Log in</Button>
                    </Link>
                    <Link to="/signup">
                        <Button className="font-medium">Sign up</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-6">
                    Advanced Multi-Agent System
                </div>
                <h1 className="text-5xl sm:text-7xl font-display font-bold tracking-tight text-foreground mb-6 leading-tight">
                    Intelligent Regulatory <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Audit System</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                    Elevate your financial document governance with Antigravity. Our state-of-the-art multi-agent
                    architecture automatically analyzes complex documents to ensure strict compliance with Indian Legal and Financial regulations.
                </p>
                <div className="flex items-center justify-center gap-4 w-full sm:w-auto">
                    <Link to="/signup" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8">Get Started</Button>
                    </Link>
                    <Link to="/about" className="w-full sm:w-auto">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8">Learn More</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default Home;
