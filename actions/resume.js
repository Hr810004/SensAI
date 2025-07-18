"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

async function getGeminiResponse(prompt, models) {
  for (const modelName of models) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      if (e.message && (e.message.includes('overloaded') || e.message.includes('503'))) {
        continue; // Try next model
      } else {
        throw e;
      }
    }
  }
  throw new Error('All Gemini models are overloaded. Please try again later.');
}

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
    2. Use action verbs and quantify achievements where possible
    3. Make each point unique and avoid repetition
    4. Use concise, professional language
    5. Return only the improved points as a JSON array of strings
  `;
  const models = ['gemini-2.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];
  try {
    const text = await getGeminiResponse(prompt, models);
    const improvedPoints = JSON.parse(text.replace(/```(?:json)?\n?/g, '').trim());
    return { improvedPoints };
  } catch (e) {
    throw new Error(e.message || 'Failed to improve resume points');
  }
}

export async function listResumes() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return await db.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getResumeById(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return await db.resume.findUnique({
    where: { id, userId },
  });
}

export async function createResume(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return await db.resume.create({
    data: { ...data, userId },
  });
}

export async function updateResume(id, data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return await db.resume.update({
    where: { id, userId },
    data,
  });
}

export async function deleteResume(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return await db.resume.delete({
    where: { id, userId },
  });
}

export async function duplicateResume(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const resume = await db.resume.findUnique({ where: { id, userId } });
  if (!resume) throw new Error("Resume not found");
  const { title, ...rest } = resume;
  return await db.resume.create({
    data: { ...rest, userId, title: `${title} (Copy)` },
  });
}
