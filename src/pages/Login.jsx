import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Accept onLogin prop to handle mock auth state
const Login = ({ onLogin }) => {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (onLogin) onLogin();
        navigate("/dashboard");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 transition-opacity hover:opacity-80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-bold tracking-tight">Compliance Sheild</span>
            </Link>

            <Card className="w-full max-w-md shadow-lg border-muted/50">
                <CardHeader className="space-y-2 text-center pb-6">
                    <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                <Input id="email" type="email" placeholder="name@example.com" required className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                    <Link to="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link>
                                </div>
                                <Input id="password" type="password" required className="h-11" />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-11 text-base font-medium">
                            Log in
                        </Button>
                        <div className="text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link to="/signup" className="font-semibold text-primary hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
