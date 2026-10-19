import { useEffect, useState } from "react";

export const DASHBOARD_HASH = "#/dashboard";

/** Hash routing: landing at #/ (default), dashboard at #/dashboard. No deps, dashboard untouched. */
export function getRoute(): "landing" | "dashboard" {
  if (typeof window === "undefined") return "landing";
  return window.location.hash.startsWith("#/dashboard") ? "dashboard" : "landing";
}

export function useHashRoute() {
  const [route, setRoute] = useState<"landing" | "dashboard">(getRoute);
  useEffect(() => {
    const onChange = () => {
      setRoute(getRoute());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
