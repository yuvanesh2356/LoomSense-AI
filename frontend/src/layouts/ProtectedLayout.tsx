import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../App";
import AppShell from "../components/layout/AppShell";
import { COLORS } from "../design-system/brand";

/**
 * React Router v6 "layout route" component. Any route nested under this
 * one in the router tree is auth-guarded and rendered inside the shared
 * application shell (sidebar + topbar + animated content area).
 */
export default function ProtectedLayout() {
  const { me, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-sm"
        style={{ backgroundColor: COLORS.ivory, color: COLORS.charcoalText, opacity: 0.6 }}
      >
        Loading...
      </div>
    );
  }

  if (!me) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
