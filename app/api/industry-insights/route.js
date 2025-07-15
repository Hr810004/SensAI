import { getIndustryInsights } from "@/actions/dashboard";

export async function GET(req) {
  try {
    const insights = await getIndustryInsights();
    return new Response(JSON.stringify(insights), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(error?.message || "Failed to fetch industry insights.", {
      status: 500,
    });
  }
} 