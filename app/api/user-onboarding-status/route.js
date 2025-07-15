import { getUserOnboardingStatus } from "@/actions/user";

export async function GET(req) {
  try {
    const status = await getUserOnboardingStatus();
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ isOnboarded: false, error: error?.message }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
} 