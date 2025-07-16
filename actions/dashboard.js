"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5-10 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 15-20 skills and trends.
        `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText);
};

export async function getIndustryInsights() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        industryInsight: true,
      },
    });

    if (!user) throw new Error("User not found");
    if (!user.industry) throw new Error("User industry not set");

    // If no insights exist, generate them
    if (!user.industryInsight) {
      const insights = await generateAIInsights(user.industry);
      const industryInsight = await db.industryInsight.create({
        data: {
          industry: user.industry,
          ...insights,
          lastUpdated: new Date(),
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return industryInsight;
    }

    // Check if the data is stale (nextUpdate < now)
    const now = new Date();
    if (user.industryInsight.nextUpdate < now) {
      // Refresh the data
      const insights = await generateAIInsights(user.industry);
      const updated = await db.industryInsight.update({
        where: { industry: user.industry },
        data: {
          ...insights,
          lastUpdated: now,
          nextUpdate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return updated;
    }

    return user.industryInsight;
  } catch (error) {
    console.error("Error in getIndustryInsights:", error);
    throw new Error(error?.message || "Failed to fetch industry insights.");
  }
}

export async function refreshIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  if (!user.industry) throw new Error("User industry not set");

  const now = new Date();
  const insights = await generateAIInsights(user.industry);
  const updated = await db.industryInsight.update({
    where: { industry: user.industry },
    data: {
      ...insights,
      lastUpdated: now,
      nextUpdate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return updated;
}
