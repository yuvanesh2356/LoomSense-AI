import React from "react";
import { DashboardSkeleton } from "../components/feedback";

/** Suspense fallback shown while a lazy-loaded route's code chunk is
 * fetched. Reuses the dashboard skeleton shape since it's a reasonable
 * generic approximation of "a page with cards is loading" for any route. */
export default function PageLoader() {
  return <DashboardSkeleton />;
}