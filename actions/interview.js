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

🚨 CRITICAL: Generate ONLY the specified number of questions. DO NOT generate 28 questions total.

EXACT QUESTION DISTRIBUTION (DO NOT EXCEED):
- Aptitude > Logical Reasoning: EXACTLY 3 questions
- Aptitude > Critical Reasoning: EXACTLY 3 questions  
- Aptitude > Quantitative Aptitude: EXACTLY 3 questions
- Aptitude > Data Interpretation: EXACTLY 3 questions
- CS Fundamentals > DSA: EXACTLY 2 questions
- CS Fundamentals > Operating Systems: EXACTLY 2 questions
- CS Fundamentals > Databases: EXACTLY 2 questions
- CS Fundamentals > Networking: EXACTLY 2 questions
- CS Fundamentals > OOP/Software Engineering: EXACTLY 2 questions
- Behavioral & Communication > Behavioral: EXACTLY 2 questions
- Behavioral & Communication > Situational: EXACTLY 2 questions
- Behavioral & Communication > Communication/Presentation: EXACTLY 2 questions

REQUIRED JSON STRUCTURE:
{
  "Aptitude": {
    "Logical Reasoning": [
      {
        "question": "Your actual question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "Why this is correct"
      },
      {
        "question": "Your second question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "explanation": "Why this is correct"
      },
      {
        "question": "Your third question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option C",
        "explanation": "Why this is correct"
      }
    ],
    "Critical Reasoning": [
      // EXACTLY 3 questions with same structure
    ],
    "Quantitative Aptitude": [
      // EXACTLY 3 questions with same structure
    ],
    "Data Interpretation": [
      // EXACTLY 3 questions with same structure
    ]
  },
  "CS Fundamentals": {
    "DSA": [
      {
        "question": "Your DSA question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "Explanation here"
      },
      {
        "question": "Your second DSA question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "explanation": "Explanation here"
      }
    ],
    "Operating Systems": [
      {
        "question": "Your OS question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "Explanation here"
      },
      {
        "question": "Your second OS question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "explanation": "Explanation here"
      }
    ],
    "Databases": [
      {
        "question": "Your database question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "Explanation here"
      },
      {
        "question": "Your second database question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "explanation": "Explanation here"
      }
    ],
    "Networking": [
      {
        "question": "Your networking question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "Explanation here"
      },
      {
        "question": "Your second networking question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "explanation": "Explanation here"
      }
    ],
    "OOP/Software Engineering": [
      {
        "question": "Your OOP question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "Explanation here"
      },
      {
        "question": "Your second OOP question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "explanation": "Explanation here"
      }
    ]
  },
  "Behavioral & Communication": {
    "Behavioral": [
      {
        "question": "Your behavioral question here",
        "explanation": "Explanation here"
      },
      {
        "question": "Your second behavioral question here",
        "explanation": "Explanation here"
      }
    ],
    "Situational": [
      {
        "question": "Your situational question here",
        "explanation": "Explanation here"
      },
      {
        "question": "Your second situational question here",
        "explanation": "Explanation here"
      }
    ],
    "Communication/Presentation": [
      {
        "question": "Your communication question here",
        "explanation": "Explanation here"
      },
      {
        "question": "Your second communication question here",
        "explanation": "Explanation here"
      }
    ]
  }
}

IMPORTANT RULES:
1. Generate EXACTLY the number specified for each subsection
2. Do NOT generate extra questions beyond the specified count
3. Do NOT generate 28 questions total - only the specified per subsection
4. Every question must have meaningful content
5. Use markdown formatting in questions: **bold**, *italic*, \`code\`, tables, etc.
6. Make questions specific to '${role || industry}' role
7. Return ONLY the JSON, no extra text

EXAMPLE: If Logical Reasoning needs 3 questions, generate exactly 3 questions, not 28.
`;
  const models = ['gemini-2.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];
  try {
    const text = await getGeminiResponse(prompt, models);
    const cleanedText = text.replace(/```(?:json)?\n?/g, '').trim();
    console.log('Raw AI response:', text.substring(0, 500) + '...');
    console.log('Cleaned text:', cleanedText.substring(0, 500) + '...');
    
    const quiz = JSON.parse(cleanedText);
    
    // Debug: Log the structure
    console.log('Quiz structure:', Object.keys(quiz));
    Object.keys(quiz).forEach(section => {
      Object.keys(quiz[section]).forEach(subsection => {
        console.log(`${section} > ${subsection}:`, quiz[section][subsection].length, 'questions');
        if (quiz[section][subsection].length > 0) {
          console.log('First question:', quiz[section][subsection][0]);
        }
      });
    });
    
    // Validate the quiz structure and remove empty questions
    let totalQuestions = 0;
    let hasEmptyQuestions = false;
    
    Object.keys(quiz).forEach(section => {
      Object.keys(quiz[section]).forEach(subsection => {
        // Filter out empty or invalid questions
        quiz[section][subsection] = quiz[section][subsection].filter(q => {
          if (!q || !q.question || q.question.trim() === '' || q.question === 'null') {
            hasEmptyQuestions = true;
            return false;
          }
          return true;
        });
        totalQuestions += quiz[section][subsection].length;
      });
    });
    
    console.log(`Generated quiz with ${totalQuestions} valid questions`);
    
    if (hasEmptyQuestions) {
      console.warn('Some questions were empty and have been removed');
    }
    
    // Ensure we don't exceed expected counts
    const expectedCounts = {
      'Aptitude': { 'Logical Reasoning': 3, 'Critical Reasoning': 3, 'Quantitative Aptitude': 3, 'Data Interpretation': 3 },
      'CS Fundamentals': { 'DSA': 2, 'Operating Systems': 2, 'Databases': 2, 'Networking': 2, 'OOP/Software Engineering': 2 },
      'Behavioral & Communication': { 'Behavioral': 2, 'Situational': 2, 'Communication/Presentation': 2 }
    };
    
    // Trim excess questions if any subsection has too many
    Object.keys(quiz).forEach(section => {
      Object.keys(quiz[section]).forEach(subsection => {
        const expected = expectedCounts[section]?.[subsection] || 2;
        if (quiz[section][subsection].length > expected) {
          quiz[section][subsection] = quiz[section][subsection].slice(0, expected);
        }
      });
    });
    
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
