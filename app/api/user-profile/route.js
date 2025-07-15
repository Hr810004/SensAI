import { getCurrentUser, updateUser } from "@/actions/user";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(error?.message || "Failed to fetch user profile.", {
      status: 401,
    });
  }
}

export async function PUT(req) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const data = await req.json();
    // Only update provided fields
    const updateData = {};
    if (data.industry) updateData.industry = data.industry;
    if (data.subIndustry) updateData.subIndustry = data.subIndustry;
    if (data.experience !== undefined) updateData.experience = Number(data.experience);
    if (data.skills) updateData.skills = data.skills;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.targetRole !== undefined) updateData.targetRole = data.targetRole;
    await db.user.update({
      where: { clerkUserId: userId },
      data: updateData,
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(error?.message || "Failed to update user profile.", {
      status: 400,
    });
  }
} 