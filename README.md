# 🚀 SensAI – AI-Powered Career Coach Platform

## �� Project Overview

**SensAI** is your all-in-one AI-powered career coach. It helps you advance your professional journey with personalized resume building, cover letter generation, mock interview practice, skill gap analysis, and real-time industry insights. SensAI is designed for job seekers, professionals, and career coaches who want to leverage AI for smarter, faster career growth.

---

## 🌟 Key Features

- **AI-Powered Career Guidance**
  - Personalized advice and insights based on your industry, experience, and target role.
  - Weekly-updated industry insights: salary data, in-demand skills, and market trends for 50+ industries.
  - Skill gap analysis and recommendations powered by Google Gemini AI.

- **Smart Resume Builder**
  - Point-based input for all sections (experience, education, projects, achievements) matching a LaTeX template.
  - ATS-optimized resume generation with AI feedback and scoring.
  - Resume upload and AI analysis for skill gaps and improvement suggestions.
  - LaTeX export for professional formatting.

- **Cover Letter Generator**
  - Instantly generate unique, role-specific cover letters tailored to your background and job description.
  - Business letter structure in markdown, avoiding repetition and clichés.

- **Mock Interview & Quiz Preparation**
  - AI-generated, role-specific quizzes and mock interviews.
  - DSA questions include both LeetCode-style and code snippet-based formats.
  - Quiz UI supports navigation, answer validation, and robust error handling.
  - Performance analytics and AI-generated improvement tips.

- **Industry Insights**
  - Real-time trends, salary data, and market analysis for 50+ industries and sub-industries.
  - Insights include salary ranges, growth rates, demand levels, top skills, market outlook, and more.

- **User Onboarding & Profile**
  - Guided onboarding for industry, sub-industry, experience, skills, and target role.
  - Clerk authentication for secure sign-in/sign-up.
  - LeetCode stats integration.

- **Modern Dashboard & UI**
  - Responsive, accessible dashboard with dark mode.
  - Quick access to all tools and personalized analytics.
  - Built with Next.js, React 19, TailwindCSS, and shadcn/ui.

- **Security & Deployment**
  - All sensitive routes protected by Clerk middleware.
  - Data encrypted and securely stored.
  - Ready for deployment on Vercel.

---

## 🛠️ Tools & Technologies

- **Next.js** (App Router)
- **React 19**
- **Prisma & PostgreSQL**
- **Clerk** (Authentication)
- **Google Gemini API** (AI content generation)
- **Inngest** (Background jobs for analytics/insights)
- **TailwindCSS & shadcn/ui** (UI components)
- **Recharts** (Data visualization)
- **Zod, React Hook Form** (Validation & forms)

---

## 🚦 Getting Started

### 1. Set Up Environment Variables

Create a `.env` file in the root of your project and add:

```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
GEMINI_API_KEY=
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up the Database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Run the Application

```bash
npm run dev
```

---

## 🌐 Deployment

1. Add environment variables to your hosting platform (e.g., Vercel, Railway, Render).
2. Deploy your app. For Vercel, connect your repo and set the environment variables.

**Live Demo:** [https://sens-ai-harsh810.live/](https://sens-ai-harsh810.live/)

---

## 🙌 Credits

Built by [Harsh810](https://harsh810.vercel.app) – Inspired by modern SaaS and AI career tools.

---

## 📖 How It Works

1. **Professional Onboarding:** Share your industry and expertise for personalized guidance.
2. **Craft Your Documents:** Create ATS-optimized resumes and compelling cover letters.
3. **Prepare for Interviews:** Practice with AI-powered mock interviews tailored to your role.
4. **Track Your Progress:** Monitor improvements with detailed performance analytics.

---

## ❓ FAQ

- **What makes SensAI unique?**  
  SensAI combines AI-powered career tools with industry-specific insights, offering an intelligent resume builder, cover letter generator, and adaptive interview preparation system—all tailored to your background.

- **How does SensAI create tailored content?**  
  SensAI learns about your industry, experience, and skills during onboarding, then uses this data to generate customized content and recommendations.

- **How secure is my data?**  
  All data is encrypted and securely stored. Clerk authentication ensures your information is protected.

---
