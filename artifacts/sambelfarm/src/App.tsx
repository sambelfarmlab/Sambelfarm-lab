import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";
import { DraftProvider } from "./lib/draft";
import Layout from "@/components/layout";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import BrainstormPage from "@/pages/brainstorm";
import GeneratorPage from "@/pages/generator";
import EditorPage from "@/pages/editor";
import CalendarPage from "@/pages/calendar";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <ProtectedRoute component={HomePage} />} />
      <Route path="/brainstorm" component={() => <ProtectedRoute component={BrainstormPage} />} />
      <Route path="/generator" component={() => <ProtectedRoute component={GeneratorPage} />} />
      <Route path="/editor" component={() => <ProtectedRoute component={EditorPage} />} />
      <Route path="/calendar" component={() => <ProtectedRoute component={CalendarPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DraftProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </DraftProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
