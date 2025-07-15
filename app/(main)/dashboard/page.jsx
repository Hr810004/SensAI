"use client";
import { useEffect, useState } from "react";
import DashboardView from "./_component/dashboard-view";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(null);
    // First, check onboarding status
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
        // Now fetch insights
        fetch("/api/industry-insights")
          .then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
          })
          .then((data) => {
            setInsights(data);
            setLoading(false);
          })
          .catch((err) => {
            setError(err.message || "Failed to load industry insights.");
            setLoading(false);
          });
      })
      .catch((err) => {
        setError(err.message || "Not authenticated or onboarding status error");
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div className="container mx-auto text-center py-20">Loading...</div>;
  if (error) {
    return (
      <div className="container mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
        <p className="text-lg text-muted-foreground">{error}</p>
        <p className="mt-4">Try refreshing the page, sign in again, or contact support if the problem persists.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} />
    </div>
  );
}
