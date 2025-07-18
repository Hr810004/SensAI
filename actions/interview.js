"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

export async function generateQuizPrompt({ company, role, user }) {
  const industry = user?.industry || role || "";
  const skills = user?.skills || [];
  const prompt = `
Generate a JSON mock interview quiz for a candidate applying for '${role || industry}' at '${company || ''}'.

- Make all questions as specific as possible to the company and role (use public info if available).
- Structure:
{
  "Aptitude": {
    "Logical Reasoning": [3 MCQs],
    "Critical Reasoning": [3 MCQs],
    "Quantitative Aptitude": [3 MCQs],
    "Data Interpretation": [3 MCQs]
  },
  "CS Fundamentals": {
    "DSA": [2 questions: 1 LeetCode-style (questionType: 'leetcode-algorithm'), 1 code snippet (questionType: 'code-correction', 'code-completion', or 'missing-line')],
    "Operating Systems": [1-2 open-ended],
    "Databases": [1-2 open-ended],
    "Networking": [1-2 open-ended],
    "OOP/Software Engineering": [1-2 open-ended]
  },
  "Behavioral & Communication": {
    "Behavioral": [1-2 open-ended],
    "Situational": [1-2 open-ended],
    "Communication/Presentation": [1-2 open-ended]
  }
}
- MCQs: 4 options, correct answer, explanation.
- DSA: 1 LeetCode-style, 1 code snippet-based.
- Open-ended: question, explanation.
- Return ONLY the JSON, no extra text or markdown.
`;
  const models = ['gemini-2.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];
  try {
    const text = await getGeminiResponse(prompt, models);
    const cleanedText = text.replace(/```(?:json)?\n?/g, '').trim();
    const quiz = JSON.parse(cleanedText);
    return quiz;
  } catch (e) {
    throw new Error(e.message || 'Failed to generate quiz');
  }
}

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  // Use the centralized function for quiz generation
  return await generateQuizPrompt({ company: null, role: null, user });
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question:${q.question}nCorrect Answer: "${q.answer}"\nUser Answer:${q.userAnswer}`     )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;
    const models = ['gemini-2.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];
    try {
      const tipText = await getGeminiResponse(improvementPrompt, models);
      improvementTip = tipText.trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}
