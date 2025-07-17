"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function saveResume(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Validate required fields
  if (!formData.contactInfo?.name || !formData.contactInfo?.email) {
    throw new Error("Name and email are required");
  }

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        contactInfo: formData.contactInfo,
        skills: formData.skills || [],
        experience: formData.experience || [],
        education: formData.education || [],
        projects: formData.projects || [],
        achievements: formData.achievements || [],
      },
      create: {
        userId: user.id,
        contactInfo: formData.contactInfo,
        skills: formData.skills || [],
        experience: formData.experience || [],
        education: formData.education || [],
        projects: formData.projects || [],
        achievements: formData.achievements || [],
      },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    if (error.code === 'P2025') {
      throw new Error("Resume already exists for this user");
    }
    throw new Error("Failed to save resume");
  }
}

export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.resume.findUnique({
    where: {
      userId: user.id,
    },
  });
}
