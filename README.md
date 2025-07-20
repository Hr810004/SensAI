# 🚀 SensAI – AI-Powered Career Coach Platform

## 📝 Project Overview

**SensAI** is an all-in-one AI-powered career coach platform for job seekers, professionals, and career coaches. It streamlines resume and cover letter creation, mock interview practice, skill gap analysis, and delivers real-time industry insights—empowering users to advance their careers with AI-driven guidance and analytics.

---

## 🌟 Key Features

- **AI-Powered Career Guidance**
  - Personalized advice and insights based on your industry, experience, and target role.
  - Weekly-updated industry insights: salary data, in-demand skills, and market trends for 50+ industries.
  - Skill gap analysis and actionable recommendations powered by Google Gemini AI.

- **Smart Resume Builder**
  - **Dynamic LaTeX Resume Export:** Instantly converts your input into a professional LaTeX resume, with seamless export to PDF or LaTeX—no manual formatting required.
  - **Gemini AI Resume Improvement:** Uses Google Gemini AI to analyze and suggest improvements for your resume bullet points, making them more impactful and tailored to your target role/company.
  - **'Improve with AI' for Points:** One-click AI enhancement of resume points for clarity, quantification, and professionalism.
  - ATS-optimized resume generation with AI feedback and scoring.

- **Cover Letter Generator**
  - Instantly generates unique, role- and company-specific cover letters tailored to your background and job description.
  - Uses business letter structure in markdown, avoiding repetition and clichés.
  - AI ensures each letter is concise, relevant, and personalized for the job.

- **Mock Interview & Quiz Preparation**
  - **Role/Company-Specific Quizzes:** AI-generated quizzes and mock interviews adapt to your chosen role and company.
  - **LeetCode & Code Snippet DSA:** Includes both LeetCode-style and code snippet-based technical questions.
  - **Tab Switching Detection:** Monitors and records tab switches during quizzes to ensure focus and simulate real interview conditions.
  - **Face Detection During Quiz:** Uses webcam and face-api.js to ensure the candidate is present and attentive during the quiz; warns or flags if no face is detected for a period.
  - Quiz UI supports navigation, answer validation, and robust error handling.
  - Performance analytics and AI-generated improvement tips after each session.

- **Skill Gap Analysis**
  - Personalized analysis based on your target role and company.
  - Actionable, AI-driven recommendations to close skill gaps and boost job-match accuracy.
  - Visualizes your strengths and areas for improvement on the dashboard.

- **Industry Insights**
  - Real-time, AI-updated trends, salary data, and market analysis for 50+ industries and sub-industries.
  - Insights include salary ranges, growth rates, demand levels, top skills, market outlook, and more.

- **User Onboarding & Profile**
  - Guided onboarding collects your industry, sub-industry, experience, skills, and target role for hyper-personalized guidance.
  - Clerk authentication for secure sign-in/sign-up.

- **Modern Dashboard & Analytics**
  - Responsive, accessible dashboard with dark mode.
  - Quick access to all tools, personalized analytics, and performance charts.
  - **Resume Upload & AI Analysis:** Upload your existing resume (PDF/LaTeX) for instant AI-driven feedback, ATS scoring, and actionable recommendations for improvement.
  - **Target Role & Company Analysis:** Get resume feedback and suggestions tailored to your desired job title and company, increasing your chances of success.
  - **LeetCode Stats & Analysis:** Integrates your LeetCode profile, analyzes your coding strengths and weaknesses, and recommends specific problems to solve based on your skill gaps and target roles.
  - Skill gap visualization and improvement tracking.

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
- **face-api.js** (Facial analysis for future features)

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

**Explore:** [https://sens-ai-harsh810.live/](https://sens-ai-harsh810.live/)

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

## 📄 Terms & Privacy Policy

By using SensAI, you agree to our terms of service and privacy policy. Your data is securely stored and never shared with third parties. For full details, please refer to our privacy policy document or contact us for more information.

---

## 📸 Screenshots

Below are example screenshots for each major feature. Replace the image paths with your actual screenshot files in the `public/` directory.

| Feature                        | Screenshot                                      |
|--------------------------------|-------------------------------------------------|
| Dashboard                      | ![Dashboard](public/banner.jpeg)                |
| Resume Builder (LaTeX Export)   | ![Resume Builder](public/banner2.jpeg)          |
| Cover Letter Generator          | ![Cover Letter](public/cover-letter.png)        |
| Quiz & Mock Interview           | ![Quiz](public/quiz.png)                        |
| Face Detection in Quiz          | ![Face Detection](public/face-detection.png)    |
| Tab Switching Detection         | ![Tab Switch](public/tab-switch.png)            |
| Resume Upload & AI Analysis     | ![Resume Upload](public/resume-upload.png)      |
| LeetCode Stats & Analysis       | ![LeetCode](public/leetcode.png)                |
| Skill Gap Visualization         | ![Skill Gap](public/skill-gap.png)              |
| Industry Insights               | ![Industry Insights](public/industry.png)       |

---

## ⚠️ Intellectual Property Notice

The source code and features of this project are the intellectual property of Harsh810. Copying, modifying, or reusing any part of this code or its features is strictly prohibited.

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
