import { getIndustryInsights } from "@/actions/dashboard";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  let insights, error;
  try {
    insights = await getIndustryInsights();
  } catch (e) {
    error = e?.message || "Failed to load industry insights.";
  }

  if (error) {
    return (
      <div className="container mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
        <p className="text-lg text-muted-foreground">{error}</p>
        <p className="mt-4">Try refreshing the page or contact support if the problem persists.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} />
    </div>
  );
}
