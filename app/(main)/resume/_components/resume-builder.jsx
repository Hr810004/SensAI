"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Loader2, Save, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume, getResume } from "@/actions/resume";
import { EntryForm, AchievementForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { resumeSchema } from "@/app/lib/schema";

export default function ResumeBuilder({ initialContent }) {
  const [activeTab, setActiveTab] = useState("form");
  const { user } = useUser();
  const [latexCode, setLatexCode] = useState("");
  const [achievements, setAchievements] = useState([]);
  const [geminiPrompt, setGeminiPrompt] = useState("");
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [previousLatexCode, setPreviousLatexCode] = useState(""); // Store previous version
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      skills: [],
      experience: [],
      education: [],
      projects: [],
      achievements: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  // Load existing resume data
  useEffect(() => {
    const loadResume = async () => {
      try {
        const resume = await getResume();
        if (resume) {
          // Reset form with existing data
          reset({
            contactInfo: resume.contactInfo || {},
            skills: resume.skills || [],
            experience: resume.experience || [],
            education: resume.education || [],
            projects: resume.projects || [],
          });
          setAchievements(resume.achievements || []);
        }
      } catch (error) {
        console.error("Error loading resume:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResume();
  }, [reset]);

  // Watch form fields for updates
  const formValues = watch();

  // Handle save result
  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  // Helper: Convert form data to LaTeX (updated with proper template and links)
  const formToLatex = (formData) => {
    const { contactInfo = {}, skills = [], experience = [], education = [], projects = [], achievements = [] } = formData;
    
    // Helper function to escape LaTeX special characters
    const escapeLatex = (text) => {
      if (!text) return "";
      return text.replace(/(%_#&{}$])/g, '\\$1');
    };

    // Helper function to extract username from URL
    const extractUsername = (url, platform) => {
      if (!url) return "";
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        if (platform === 'linkedin') {
          const match = path.match(/\/in\/([^\/]+)/);
          return match ? match[1] : "";
        } else if (platform === 'github') {
          const match = path.match(/\/([^\/]+)$/);
          return match ? match[1] : "";
        }
      } catch (e) {
        // If URL parsing fails, try to extract from the string
        if (platform === 'linkedin') {
          const match = url.match(/linkedin\.com\/in\/([^\/\s]+)/);
          return match ? match[1] : "";
        } else if (platform === 'github') {
          const match = url.match(/github\.com\/([^\/\s]+)/);
          return match ? match[1] : "";
        }
      }
      return "";
    };

    // Generate LaTeX for achievements with optional links
    const achievementsLatex = achievements.length > 0
      ? `
%-----------ACHIEVEMENTS-----------
\\section{Achievements}
\\begin{itemize}[leftmargin=0.15in, label={}, itemsep=2pt, topsep=0pt]
  \\item[] \\small{
    ${achievements.map(achievement =>
      (achievement.points || []).map(pt => {
        const text = escapeLatex(pt);
        if (achievement.url) {
          return `\\href{${achievement.url}}{${text}}`;
        }
        return text;
      }).join(" \\\\ ")
    ).join(" \\\\ ")}
  }
\\end{itemize}`
      : "";

    // Generate LaTeX for projects with multiple links
    const projectsLatex = projects.length > 0
      ? `
%-----------PROJECTS-----------
\\section{Personal Projects}
  \\resumeSubHeadingListStart
${projects.map(project => {
  const title = escapeLatex(project.title);
  const techStack = project.organization ? `\\emph{${escapeLatex(project.organization)}}` : "";
  const date = project.startDate || "";
  
  // Generate links for the project
  const linksLatex = project.links && project.links.length > 0
    ? project.links.map(link => `\\href{${link.url}}{\\underline{${link.label}}}`).join(' $|$ ')
    : "";

  const projectLinks = linksLatex ? ` $|$ ${linksLatex}` : "";
  
  return `   \\resumeProjectHeading
      {\\textbf{${title}} $|$ ${techStack}${projectLinks}}{${date}}
  \\resumeItemListStart
${(project.points || []).map(pt => `     \\resumeItem{${escapeLatex(pt)}}`).join('\n')}
  \\resumeItemListEnd`;
}).join('\n')}
  \\resumeSubHeadingListEnd`
      : "";

    // Generate LaTeX for experience
    const experienceLatex = experience.length > 0
      ? `
%-----------EXPERIENCE-----------
\\section{Experience / Internship}
  \\resumeSubHeadingListStart
${experience.map(exp => `    \\resumeSubheading
      {${escapeLatex(exp.organization)} -- ${escapeLatex(exp.title)}} {${exp.startDate || ""} -- ${exp.current ? "Present" : exp.endDate || ""}}
      {${escapeLatex(exp.location || "")}}{}
      \\resumeItemListStart
${(exp.points || []).map(pt => `        \\resumeItem{${escapeLatex(pt)}}`).join('\n')}
      \\resumeItemListEnd`).join('\n')}
  \\resumeSubHeadingListEnd`
      : "";

    // Generate LaTeX for education - Fixed to match your format exactly
    const educationLatex = education.length > 0
      ? `
%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${education.map(edu => `    \\resumeSubheading
      {${escapeLatex(edu.institution)}}{${edu.endDate || ""}}
      {${escapeLatex(edu.degree)}}{${edu.gpa ? `CGPA: ${edu.gpa}` : ""}}     ${(edu.points && edu.points.length > 0) ? `\\resumeItemListStart\\n${edu.points.map(pt => `        \\resumeItem{${escapeLatex(pt)}}`).join('\n')}\\n      \\resumeItemListEnd` : ""}`
).join('\n')}
  \\resumeSubHeadingListEnd`
      : "";

    // Generate LaTeX for skills
    const skillsLatex = skills.length > 0
      ? `
%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills and Interests}
\\begin{itemize}[leftmargin=0.15in, label={}, itemsep=1pt, topsep=0pt]
  \\item[] \\small{
    ${skills.map(skill => {
      const text = escapeLatex(skill.text);
      if (text.includes(':')) {
        const [category, ...rest] = text.split(':');
        return `\\textbf{${category.trim()}:} ${rest.join(':').trim()}`;
      }
      return text;
    }).join(' \\\\n    ')}
  }
\\end{itemize}`
      : "";

    // Build contact information with proper URL extraction
    const linkedinUsername = extractUsername(contactInfo.linkedin, 'linkedin');
    const githubUsername = extractUsername(contactInfo.github, 'github');
    const contactLatex = `\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(contactInfo.name || "Your Name")}} \\\\ \\vspace{1pt}
    ${escapeLatex(contactInfo.location || "City, Country")} \\\\ \\vspace{1pt}
    \\small
    ${contactInfo.phone ? `\\faPhone \\ ${escapeLatex(contactInfo.phone)} $|$` : ""}
    ${contactInfo.email ? `\\faEnvelope \\ \\href{mailto:${contactInfo.email}}{\\underline{${contactInfo.email}}} $|$` : ""}
    ${linkedinUsername ? `\\faLinkedinSquare \\ \\href{${contactInfo.linkedin}}{\\underline{linkedin.com/in/${linkedinUsername}}} $|$` : ""}
    ${githubUsername ? `\\faGithub \\ \\href{${contactInfo.github}}{\\underline{github.com/${githubUsername}}}` : ""}
\\end{center}`;

    return `\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{graphicx}
\\usepackage{fontawesome}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\footnotesize #3} & \\textit{\\footnotesize #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]} 
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

${contactLatex}

${educationLatex}

${experienceLatex}

${projectsLatex}

${skillsLatex}

${achievementsLatex}

\\end{document}`;
  };

  // Gemini AI integration
  const handleGeminiPrompt = async () => {
    if (!geminiPrompt.trim()) {
      toast.error("Please enter a prompt for Gemini");
      return;
    }

    // Store the current LaTeX code before making changes
    setPreviousLatexCode(latexCode);
    setIsGeminiLoading(true);
    
    try {
      const response = await fetch("/api/gemini-recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: geminiPrompt,
          formData: { ...formValues, achievements },
          currentLatex: latexCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get Gemini response");
      }

      const data = await response.json();
      
      if (data.latexCode) {
        setLatexCode(data.latexCode);
        toast.success("LaTeX code updated with Gemini's suggestions!");
      } else {
        toast.error("No LaTeX code received from Gemini");
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      toast.error(error.message || "Failed to get Gemini response");
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // Undo Gemini changes
  const handleUndoGeminiChanges = () => {
    if (previousLatexCode && confirm("Are you sure you want to restore the previous LaTeX code? This will undo all Gemini changes.")) {
      setLatexCode(previousLatexCode);
      setPreviousLatexCode(""); // Clear the stored version
      toast.success("Previous LaTeX code restored!");
    }
  };

  // Copy LaTeX code to clipboard
  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexCode);
    toast.success("LaTeX code copied to clipboard!");
  };

  const getContactMarkdown = () => {
    const { contactInfo } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo.linkedin)
      parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);

    return parts.length > 0
      ? `## <div align="center">${user.fullName}</div>
        \n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
      : "";
  };

  const getCombinedContent = () => {
    const { skills, experience, education, projects } = formValues;
    return [
      getContactMarkdown(),
      skills && `## Skills\n\n${skills.map(skill => `- ${skill.text}`).join('\n')}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  // Helper function to convert entries to markdown
  const entriesToMarkdown = (entries, title) => {
    if (!entries || entries.length === 0) return null;
    
    const entriesMarkdown = entries.map(entry => {
      const dateRange = entry.current 
          ? `${entry.startDate} - Present`
          : `${entry.startDate} - ${entry.endDate}`;
        
      let entryText = `### ${entry.title || entry.degree} @ ${entry.organization || entry.institution}\n`;
      entryText += `*${dateRange}*\n\n`;
      
      if (entry.fieldOfStudy) {
        entryText += `**Field:** ${entry.fieldOfStudy}\n\n`;
      }
      
      if (entry.gpa) {
        entryText += `**GPA:** ${entry.gpa}\n\n`;
      }
      
      if (entry.points && entry.points.length > 0) {
        entryText += entry.points.map(point => `- ${point}`).join('\n');
      }
      
      return entryText;
    }).join('\n\n');
    
    return `## ${title}\n\n${entriesMarkdown}`;
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadLatex = async () => {
    setIsDownloading(true);
    try {
      // Use the current LaTeX code directly
      const currentLatex = latexCode || formToLatex({ ...watch(), achievements });
      
      // Create blob and download
      const blob = new Blob([currentLatex], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.tex';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("LaTeX file downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download LaTeX file");
    } finally {
      setIsDownloading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Save the structured form data
      await saveResumeFn({ ...data, achievements });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <div data-color-mode="light" className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">
          Resume Builder
        </h1>
        <div className="space-x-2">
          <Button
            variant="destructive"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button onClick={downloadLatex} disabled={isDownloading || isLoading}>
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download LaTeX
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading resume data...</span>
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="latex">LaTeX</TabsTrigger>
          </TabsList>

          {/* Form Tab - Reordered sections */}
          <TabsContent value="form">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      {...register("contactInfo.name")}
                      placeholder="Your Full Name"
                      error={errors.contactInfo?.name}
                    />
                    {errors.contactInfo?.name && (
                      <p className="text-sm text-red-500">
                        {errors.contactInfo.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      {...register("contactInfo.location")}
                      placeholder="City, State, Country"
                      error={errors.contactInfo?.location}
                    />
                    {errors.contactInfo?.location && (
                      <p className="text-sm text-red-500">
                        {errors.contactInfo.location.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      {...register("contactInfo.phone")}
                      type="tel"
                      placeholder="+1 234 567 8900"
                      error={errors.contactInfo?.phone}
                    />
                    {errors.contactInfo?.phone && (
                      <p className="text-sm text-red-500">
                        {errors.contactInfo.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      {...register("contactInfo.email")}
                      type="email"
                      placeholder="your@email.com"
                      error={errors.contactInfo?.email}
                    />
                    {errors.contactInfo?.email && (
                      <p className="text-sm text-red-500">
                        {errors.contactInfo.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">LinkedIn URL</label>
                    <Input
                      {...register("contactInfo.linkedin")}
                      type="url"
                      placeholder="https://linkedin.com/in/your-profile"
                      error={errors.contactInfo?.linkedin}
                    />
                    {errors.contactInfo?.linkedin && (
                      <p className="text-sm text-red-500">
                        {errors.contactInfo.linkedin.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GitHub URL</label>
                    <Input
                      {...register("contactInfo.github")}
                      type="url"
                      placeholder="https://github.com/your-username"
                      error={errors.contactInfo?.github}
                    />
                    {errors.contactInfo?.github && (
                      <p className="text-sm text-red-500">
                        {errors.contactInfo.github.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Education</h3>
                <Controller
                  name="education"
                  control={control}
                  render={({ field }) => (
                    <EntryForm
                      type="Education"
                      entries={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.education && (
                  <p className="text-sm text-red-500">
                    {errors.education.message}
                  </p>
                )}
              </div>

              {/* Experience */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Work Experience</h3>
                <Controller
                  name="experience"
                  control={control}
                  render={({ field }) => (
                    <EntryForm
                      type="Experience"
                      entries={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.experience && (
                  <p className="text-sm text-red-500">
                    {errors.experience.message}
                  </p>
                )}
              </div>

              {/* Projects */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Projects</h3>
                <Controller
                  name="projects"
                  control={control}
                  render={({ field }) => (
                    <EntryForm
                      type="Project"
                      entries={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.projects && (
                  <p className="text-sm text-red-500">
                    {errors.projects.message}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Technical Skills and Interests</h3>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      {field.value.map((skill, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder={`Programming Languages: Java, Python, ...`}
                            {...register(`skills.${index}.text`)}
                            error={errors.skills?.[index]?.text}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setValue("skills", field.value.filter((_, i) => i !== index))}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </Button>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-1">Format: Programming Languages: Java, Python, ...</p>
                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={() => setValue("skills", [...field.value, { text: "" }])}
                        disabled={field.value.length >= 5}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" /> Add Skill
                      </Button>
                    </div>
                  )}
                />
                {errors.skills && (
                  <p className="text-sm text-red-500">{errors.skills.message}</p>
                )}
              </div>

              {/* Achievements */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Achievements</h3>
                <AchievementForm
                  achievements={achievements}
                  onChange={setAchievements}
                />
              </div>
              {/* Convert to LaTeX Button */}
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    setLatexCode(formToLatex({ ...formValues, achievements }));
                    toast.success("LaTeX code updated!");
                  }}
                >
                  Convert to LaTeX
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* LaTeX Tab */}
          <TabsContent value="latex">
            <Textarea
              value={latexCode}
              onChange={e => setLatexCode(e.target.value)}
              className="h-96 font-mono"
            />
            <div className="flex gap-2 mt-2">
              <Input
                value={geminiPrompt}
                onChange={e => setGeminiPrompt(e.target.value)}
                placeholder="Ask Gemini to improve or generate LaTeX..."
                disabled={isGeminiLoading}
              />
              <Button 
                onClick={handleGeminiPrompt} 
                disabled={isGeminiLoading}
              >
                {isGeminiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Send to Gemini"
                )}
              </Button>
              {previousLatexCode && (
                <Button 
                  onClick={handleUndoGeminiChanges} 
                  variant="outline"
                  disabled={isGeminiLoading}
                >
                  Undo Gemini Changes
                </Button>
              )}
              <Button onClick={handleCopyLatex} variant="outline">Copy LaTeX</Button>
            </div>
          </TabsContent>


        </Tabs>
      )}
    </div>
  );
}
