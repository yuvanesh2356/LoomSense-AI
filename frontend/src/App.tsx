import React, { createContext, useContext, useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login as apiLogin, getMe, MeResponse } from "./api";
import { APP_NAME, APP_TAGLINE } from "./design-system/brand";
import ProtectedLayout from "./layouts/ProtectedLayout";
import ComingSoonPage from "./pages/ComingSoonPage";
import { NAV_ITEMS, UTILITY_NAV_ITEMS } from "./config/navigation";
import PageLoader from "./pages/PageLoader";
import ErrorBoundary from "./components/ErrorBoundary";
import AnimatedLoom from "./landing/AnimatedLoom";
import { COLORS } from "./design-system/brand";
import { LanguageProvider } from "./context/LanguageProvider";

// Entry screens stay eagerly imported — no benefit to code-splitting the
// very first thing a visitor sees; everything past login is lazy-loaded
// so the initial bundle stays small.
import LandingPage from "./landing/LandingPage";

// --- Lazy-loaded authenticated pages ------------------------------------------
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ForecastPage = lazy(() => import("./pages/Forecast"));
const IncomePage = lazy(() => import("./pages/Income"));
const DemandHeatmap = lazy(() => import("./pages/DemandHeatmap"));
const ProductionPlanner = lazy(() => import("./pages/ProductionPlanner"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const FestivalPredictor = lazy(() => import("./pages/FestivalPredictor"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const GovernmentSchemes = lazy(() => import("./pages/GovernmentSchemes"));
const Inventory = lazy(() => import("./pages/Inventory"));
const SmartAlerts = lazy(() => import("./pages/SmartAlerts"));
const LearningHub = lazy(() => import("./pages/LearningHub"));
const Community = lazy(() => import("./pages/Community"));
const Analytics = lazy(() => import("./pages/Analytics"));
const FabricRecognition = lazy(() => import("./pages/FabricRecognition"));
const WhatShouldIWeave = lazy(() => import("./pages/WhatShouldIWeave"));

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

// --- Redesigned Login page ------------------------------------------------------
// NOTE: auth logic (apiLogin call, token storage, refresh, navigate) is
// byte-identical to the previous version — only presentation changed.
function LoginPage() {
  const [username, setUsername] = useState(() => localStorage.getItem("ls_remember_username") || "lakshmi");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem("ls_remember_username")));
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
      if (rememberMe) localStorage.setItem("ls_remember_username", username);
      else localStorage.removeItem("ls_remember_username");
      await refresh();
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: COLORS.ivory }}>
      {/* Left: branding panel — hidden on small screens */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative overflow-hidden px-12"
        style={{ backgroundColor: COLORS.emeraldDeep }}
      >
        <div
          className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: COLORS.gold }}
        />
        <div
          className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: COLORS.emeraldBright }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-md"
        >
          <AnimatedLoom className="w-full h-auto mb-8" />
          <h2 className="font-display text-3xl font-bold text-white leading-snug mb-3">
            {APP_NAME}
          </h2>
          <p className="text-white/75 text-sm leading-relaxed">{APP_TAGLINE}</p>
        </motion.div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden text-center">
            <p className="font-display text-2xl font-bold" style={{ color: COLORS.emeraldDeep }}>{APP_NAME}</p>
            <p className="text-xs mt-1" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>{APP_TAGLINE}</p>
          </div>

          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: COLORS.emeraldDeep }}>
            Welcome back
          </h1>
          <p className="text-sm mb-7" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>
            Sign in to continue to your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.charcoalText, opacity: 0.7 }}>
                Username
              </label>
              <input
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2"
                style={{ borderColor: "#EAE4D6", ["--tw-ring-color" as any]: COLORS.emeraldDeep }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold" style={{ color: COLORS.charcoalText, opacity: 0.7 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Password reset isn't wired up in this demo yet.")}
                  className="text-xs font-medium"
                  style={{ color: COLORS.emeraldDeep }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition focus:ring-2"
                  style={{ borderColor: "#EAE4D6", ["--tw-ring-color" as any]: COLORS.emeraldDeep }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={16} style={{ color: COLORS.charcoalText, opacity: 0.5 }} />
                  ) : (
                    <Eye size={16} style={{ color: COLORS.charcoalText, opacity: 0.5 }} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: COLORS.charcoalText }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded"
                style={{ accentColor: COLORS.emeraldDeep }}
              />
              Remember me
            </label>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="text-sm font-medium"
                  style={{ color: "#A63A50" }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.01 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-70"
              style={{ backgroundColor: COLORS.emeraldDeep }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Signing in..." : "Sign In"}
            </motion.button>
          </form>

          <p className="text-xs mt-6 text-center" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>
            Demo accounts: lakshmi / ravi / meena &middot; password: demo123
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedLayout />}>
              <Route
                path="/dashboard"
                element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>}
              />
              <Route
                path="/forecast"
                element={<Suspense fallback={<PageLoader />}><ForecastPage /></Suspense>}
              />
              <Route
                path="/income"
                element={<Suspense fallback={<PageLoader />}><IncomePage /></Suspense>}
              />
              <Route
                path="/market-trends"
                element={<Suspense fallback={<PageLoader />}><DemandHeatmap /></Suspense>}
              />
              <Route
                path="/production-planner"
                element={<Suspense fallback={<PageLoader />}><ProductionPlanner /></Suspense>}
              />
              <Route
                path="/ai-assistant"
                element={<Suspense fallback={<PageLoader />}><AIAssistant /></Suspense>}
              />
              <Route
                path="/festival-predictor"
                element={<Suspense fallback={<PageLoader />}><FestivalPredictor /></Suspense>}
              />
              <Route
                path="/marketplace"
                element={<Suspense fallback={<PageLoader />}><Marketplace /></Suspense>}
              />
              <Route
                path="/government-schemes"
                element={<Suspense fallback={<PageLoader />}><GovernmentSchemes /></Suspense>}
              />
              <Route
                path="/inventory"
                element={<Suspense fallback={<PageLoader />}><Inventory /></Suspense>}
              />
              <Route
                path="/alerts"
                element={<Suspense fallback={<PageLoader />}><SmartAlerts /></Suspense>}
              />
              <Route
                path="/learning-hub"
                element={<Suspense fallback={<PageLoader />}><LearningHub /></Suspense>}
              />
              <Route
                path="/community"
                element={<Suspense fallback={<PageLoader />}><Community /></Suspense>}
              />
              <Route
                path="/analytics"
                element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>}
              />
              <Route
                path="/fabric-recognition"
                element={<Suspense fallback={<PageLoader />}><FabricRecognition /></Suspense>}
              />
              <Route
                path="/what-to-weave"
                element={<Suspense fallback={<PageLoader />}><WhatShouldIWeave /></Suspense>}
              />

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
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}