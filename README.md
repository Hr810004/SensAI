# 🚀 SensAI – AI-Powered Career Coach Platform

## 📌 Project Overview

Welcome to **SensAI**, your all-in-one AI-powered career coach platform. SensAI helps you advance your professional journey with personalized cover letter generation, mock interview practice, career guidance, performance analytics, and real-time industry insights. Built with the latest web technologies, SensAI is perfect for job seekers, professionals, and career coaches who want to leverage AI for smarter career growth.

---

## 🌟 Key Features

- 🤖 **AI-Powered Career Guidance** – Get personalized advice and insights tailored to your industry and experience.
- 📝 **Smart Resume Builder** – Create ATS-optimized resumes with AI assistance and actionable feedback.
- 📄 **Cover Letter Generator** – Instantly generate professional, role-specific cover letters.
- 🎤 **Mock Interview Practice** – Practice with AI-generated, role-specific questions and receive instant feedback.
- 📊 **Performance Analytics** – Track your interview progress and receive improvement tips.
- 💼 **Industry Insights** – Access up-to-date salary data, in-demand skills, and market trends for 50+ industries.
- 🔒 **Secure Authentication** – Powered by Clerk for seamless and secure sign-in/sign-up.
- 🌙 **Modern UI/UX** – Beautiful, responsive design with TailwindCSS and Shadcn UI components.

---

## 🛠️ Tools & Technologies

- **Next.js**: Modern React framework for full-stack web apps
- **React 19**: Latest features for fast, interactive UIs
- **Prisma & PostgreSQL**: Robust ORM and scalable relational database
- **Clerk**: Secure authentication and user management
- **Google Gemini API**: Advanced AI for content generation
- **Inngest**: Background jobs and scheduled AI analytics
- **TailwindCSS & Shadcn UI**: Customizable, beautiful component library
- **Recharts**: Data visualization for analytics
- **Zod, React Hook Form**: Type-safe validation and forms

---

## 🚦 Getting Started

### 1. Set Up Environment Variables

Create a `.env` file in the root of your project and add the following variables:

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

Make sure your `DATABASE_URL` points to a PostgreSQL instance. Then run:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Run the Application

Start the development server:

```bash
npm run dev
```

**SensAI is live at [https://sens-ai-harsh810.live/](https://sens-ai-harsh810.live/) – hosted on Vercel.**

---

## 🌐 Deployment

### 1. Add Environment Variables
Add the `.env` variables to your hosting platform (e.g., Vercel, Railway, Render).

### 2. Deploy
Deploy your app using your preferred method. For Vercel, simply connect your repo and set the environment variables.

<<<<<<< HEAD
> **SensAI is live at [https://sens-ai-harsh810.live/](https://sens-ai-harsh810.live/) – hosted on Vercel.**

=======
>>>>>>> 70ad7131958a19c4ac18e6123bffa7f938fab122
---

## 🙌 Credits

Built by [Harsh810](https://harsh810.vercel.app) – Inspired by modern SaaS and AI career tools.
