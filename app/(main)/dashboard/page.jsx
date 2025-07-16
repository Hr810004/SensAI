"use client";
import { useEffect, useState } from "react";
import DashboardView from "./_component/dashboard-view";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardPage() {
  const [insights, setInsights] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewKey, setViewKey] = useState(Date.now());
  const router = useRouter();
  const pathname = usePathname();

  const fetchData = () => {
    console.log("[DashboardPage] fetchData called");
    setLoading(true);
    setError(null);
    fetch("/api/user-onboarding-status")
      .then(async (res) => {
        if (!res.ok) throw new Error("Not authenticated or onboarding status error");
        return res.json();
      })
      .then((data) => {
        if (!data.isOnboarded) {
          router.replace("/onboarding");
          return;
        }
        fetch("/api/user-profile")
          .then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
          })
          .then((userData) => {
            setUser(userData);
            fetch("/api/industry-insights")
              .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
              })
              .then((data) => {
                setInsights(data);
                setLoading(false);
                console.log("[DashboardPage] Data loaded", { user: userData, insights: data });
              })
              .catch((err) => {
                setError(err.message || "Failed to load industry insights.");
                setLoading(false);
              });
          })
          .catch((err) => {
            setError(err.message || "Failed to load user profile.");
            setLoading(false);
          });
      })
      .catch((err) => {
        setError(err.message || "Not authenticated or onboarding status error");
        setLoading(false);
      });
  };

  useEffect(() => {
    console.log("[DashboardPage] useEffect triggered", pathname);
    if (pathname === "/dashboard") {
      setViewKey(Date.now());
      fetchData();
    }
  }, [pathname]);

  if (loading) {
    console.log("[DashboardPage] Loading...");
    return <div className="container mx-auto text-center py-20">Loading...</div>;
  }
  if (error) {
    console.log("[DashboardPage] Error:", error);
    return (
      <div className="container mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
        <p className="text-lg text-muted-foreground">{error}</p>
        <p className="mt-4">Try refreshing the page, sign in again, or contact support if the problem persists.</p>
      </div>
    );
  }

  console.log("[DashboardPage] Rendering DashboardView", { user, insights, viewKey });
  return (
    <div className="container mx-auto">
      <DashboardView key={viewKey} insights={insights} user={user} />
    </div>
  );
}
