import { z } from "zod";

export const onboardingSchema = z.object({
  industry: z.string({
    required_error: "Please select an industry",
  }),
  subIndustry: z.string({
    required_error: "Please select a specialization",
  }),
  bio: z.string().max(500).optional(),
  experience: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .min(0, "Experience must be at least 0 years")
        .max(50, "Experience cannot exceed 50 years")
    ),
  skills: z.string().transform((val) =>
    val
      ? val
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : undefined
  ),
  targetRole: z.string({ required_error: "Please enter your target role" }),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  linkedin: z.string().url("Invalid LinkedIn URL").optional(),
  github: z.string().url("Invalid GitHub URL").optional(),
});

// Schema for links (used in projects and achievements)
export const linkSchema = z.object({
  label: z.string().min(1, "Link label is required"),
  url: z.string().url("Invalid URL"),
});

export const entrySchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    organization: z.string().min(1, "Organization is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    links: z.array(linkSchema).optional(), // Optional links for projects
  })
  .refine(
    (data) => {
      if (!data.current && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "End date is required unless this is your current position",
      path: ["endDate"],
    }
  );

// Schema for achievements with optional links
export const achievementSchema = z.object({
  text: z.string().min(1, "Achievement text is required"),
  url: z.string().url("Invalid URL").optional(),
});

// Schema for education entries (distinct from experience)
export const educationEntrySchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution/University is required"),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
  gpa: z.string().optional(), // GPA (optional)
});

export const resumeSchema = z.object({
  contactInfo: contactSchema,
  skills: z.array(z.object({ text: z.string().min(1, "Skill is required") })).min(1, "At least one skill is required").max(5, "Maximum 5 skills allowed"),
  experience: z.array(entrySchema),
  education: z.array(educationEntrySchema), 
  projects: z.array(entrySchema),
  achievements: z.array(achievementSchema).optional(),
});

export const coverLetterSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required"),
});
