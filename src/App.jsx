import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import UploadAnalyze from "./pages/UploadAnalyze";
import AnalysisOptions from "./pages/AnalysisOptions";
import Processing from "./pages/Processing";
import Results from "./pages/Results";
import History from "./pages/History";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {isAuthenticated && <Navbar />}
          <main className={isAuthenticated ? "min-h-[calc(100vh-4rem)]" : "min-h-screen"}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={!isAuthenticated ? <Home /> : <Navigate to="/dashboard" />} />
              <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/dashboard" />} />
              <Route path="/signup" element={!isAuthenticated ? <SignUp onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/dashboard" />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/upload" element={isAuthenticated ? <UploadAnalyze /> : <Navigate to="/login" />} />
              <Route path="/analysis-options" element={isAuthenticated ? <AnalysisOptions /> : <Navigate to="/login" />} />
              <Route path="/processing" element={isAuthenticated ? <Processing /> : <Navigate to="/login" />} />
              <Route path="/results" element={isAuthenticated ? <Results /> : <Navigate to="/login" />} />
              <Route path="/history" element={isAuthenticated ? <History /> : <Navigate to="/login" />} />
              <Route path="/about" element={isAuthenticated ? <About /> : <Navigate to="/login" />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;