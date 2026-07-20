import React, { createContext, useContext, useEffect, useState } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation,
} from "react-router-dom";
import { login as apiLogin, getMe, MeResponse } from "./api";
import Dashboard from "./pages/Dashboard";
import ForecastPage from "./pages/Forecast";
import IncomePage from "./pages/Income";
import { Button, Card } from "./components/ui";

// --- Auth context ------------------------------------------------------------
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

// --- Login page (merged into App.tsx) ----------------------------------------
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
      navigate("/");
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
          <div className="text-3xl font-bold text-[#2B3A67]">LoomSense AI</div>
          <p className="text-[#5B6B7A] mt-1">Know what to weave, before you weave it.</p>
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

// --- Layout with nav -----------------------------------------------------------
function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, logout } = useAuth();
  const location = useLocation();

  const navItem = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        location.pathname === to
          ? "bg-[#2B3A67] text-white"
          : "text-[#2B3A67] hover:bg-[#2B3A67]/10"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#FBF7F0]">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold text-[#2B3A67]">LoomSense AI</div>
          <nav className="flex gap-2">
            {navItem("/", "Dashboard")}
            {navItem("/forecast", "Forecast")}
            {navItem("/income", "Income Calendar")}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#5B6B7A]">
            {me?.weaver.name} · {me?.weaver.cluster}
          </span>
          <button
            onClick={logout}
            className="text-sm text-[#A63A50] font-medium hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#5B6B7A]">
        Loading...
      </div>
    );
  }
  if (!me) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forecast"
            element={
              <ProtectedRoute>
                <ForecastPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/income"
            element={
              <ProtectedRoute>
                <IncomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
