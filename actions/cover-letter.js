"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Write a highly professional, unique, and compelling cover letter for a ${data.jobTitle} position at ${data.companyName}.
    
    About the candidate:
    - Name: ${data.applicantName}
    - Email: ${data.applicantEmail}
    - Phone: ${data.applicantPhone || 'Not provided'}
    - Location: ${data.applicantLocation || 'Not provided'}
    - LinkedIn: ${data.applicantLinkedin || 'Not provided'}
    - Industry: ${user.industry}
    - Years of Experience: ${data.yearsOfExperience || user.experience}
    - Key Skills: ${data.keySkills || user.skills?.join(", ")}
    - Relevant Experience: ${data.relevantExperience || user.bio}
    - Tone Preference: ${data.tone}
    - Focus Area: ${data.focus}
    
    Job Description:
    ${data.jobDescription}
    
    Requirements:
    1. Use a ${data.tone} tone throughout the letter
    2. Focus primarily on ${data.focus} aspects
    3. Start with a strong, tailored opening that grabs attention and references the company/role
    4. Highlight the most relevant skills and experience, using specific, quantifiable achievements where possible
    5. Show deep understanding of the company's needs and culture
    6. Vary sentence structure and vocabulary to avoid generic or repetitive phrasing
    7. End with a memorable, personalized closing that invites further discussion
    8. Do NOT repeat content or structure from previous cover letters; make each letter unique and tailored
    9. Keep it concise (max 400 words)
    10. Use proper business letter formatting in markdown with the applicant's contact information
    11. Avoid clichés and generic statements—be specific and authentic
    12. Include the applicant's name, email, and phone in the header if provided
    
    Format the letter in markdown with proper business letter structure including contact information header.
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        // Applicant information
        applicantName: data.applicantName,
        applicantEmail: data.applicantEmail,
        applicantPhone: data.applicantPhone,
        applicantLocation: data.applicantLocation,
        applicantLinkedin: data.applicantLinkedin,
        // Professional background
        yearsOfExperience: data.yearsOfExperience,
        keySkills: data.keySkills,
        relevantExperience: data.relevantExperience,
        // Cover letter customization
        tone: data.tone,
        focus: data.focus,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    throw new Error("Failed to generate cover letter");
  }
}

export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}
