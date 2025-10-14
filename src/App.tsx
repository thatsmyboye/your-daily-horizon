import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Missions from "./pages/Missions";
import Mentor from "./pages/Mentor";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import DocsSetup from "./pages/DocsSetup";
import ProtectedRoute from "./pages/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/app/missions" element={
            <ProtectedRoute>
              <Missions />
            </ProtectedRoute>
          } />
          <Route path="/app/mentor" element={
            <ProtectedRoute>
              <Mentor />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={<Settings />} />
          <Route path="/docs/setup" element={<DocsSetup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
