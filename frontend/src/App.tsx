import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { login as apiLogin, getMe, MeResponse } from "./api";
import Dashboard from "./pages/Dashboard";
import ForecastPage from "./pages/Forecast";
import IncomePage from "./pages/Income";
import DemandHeatmap from "./pages/DemandHeatmap";
import ProductionPlanner from "./pages/ProductionPlanner";
import AIAssistant from "./pages/AIAssistant";
import { Button, Card } from "./components/ui";
import LandingPage from "./landing/LandingPage";
import { APP_NAME, APP_TAGLINE } from "./design-system/brand";
import ProtectedLayout from "./layouts/ProtectedLayout";
import ComingSoonPage from "./pages/ComingSoonPage";
import { NAV_ITEMS, UTILITY_NAV_ITEMS } from "./config/navigation";

interface AuthContextValue {
  me: MeResponse | null;
  loading: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  me: null,
  loading: true,
  logout: () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = localStorage.getItem("ls_token");
    if (!token) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getMe();
      setMe(data);
    } catch {
      localStorage.removeItem("ls_token");
      setMe(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const logout = () => {
    localStorage.removeItem("ls_token");
    setMe(null);
  };

  return (
    <AuthContext.Provider value={{ me, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

function LoginPage() {
  const [username, setUsername] = useState("lakshmi");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await apiLogin(username, password);
      localStorage.setItem("ls_token", result.token);
      await refresh();
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-[#2B3A67]">{APP_NAME}</div>
          <p className="text-[#5B6B7A] mt-1">{APP_TAGLINE}</p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2A2A2A] mb-1">
                Username
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2B3A67]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2A2A2A] mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2B3A67]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-[#A63A50]">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-xs text-[#5B6B7A] mt-4 text-center">
            Demo accounts: lakshmi / ravi / meena — password: demo123
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/market-trends" element={<DemandHeatmap />} />
            {/* Phase 5+6 */}
            <Route path="/production-planner" element={<ProductionPlanner />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />

            {[...NAV_ITEMS, ...UTILITY_NAV_ITEMS]
              .filter((item) => item.comingSoon)
              .map((item) => (
                <Route
                  key={item.path}
                  path={item.path}
                  element={
                    <ComingSoonPage
                      title={item.label}
                      description={item.description ?? ""}
                      icon={item.icon}
                      phaseLabel={item.phaseLabel ?? "Coming soon"}
                    />
                  }
                />
              ))}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}