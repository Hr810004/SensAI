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

export async function improveWithAI({ type, title, organization, currentPoints }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Improve the following ${type.toLowerCase()} points for a resume. Make them more impactful, specific, and professional.
    
    ${type}: ${title}
    Organization: ${organization}
    Current Points:
    ${currentPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}
    
    Requirements:
    1. Keep the same number of points
    2. Make each point more specific with quantifiable achievements where possible
    3. Use strong action verbs
    4. Focus on results and impact
    5. Make them more professional and compelling
    6. Keep each point concise (1-2 lines max)
    7. Maintain the original meaning but enhance the impact
    
    Return only the improved points as a JSON array of strings.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    // Try to parse as JSON, if it fails, return the text as-is
    try {
      const improvedPoints = JSON.parse(response);
      return { improvedPoints: Array.isArray(improvedPoints) ? improvedPoints : currentPoints };
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      return { improvedPoints: currentPoints };
    }
  } catch (error) {
    console.error("Error improving with AI:", error);
    throw new Error("Failed to improve points with AI");
  }
}
