"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BriefcaseIcon,
  LineChart,
  TrendingUp,
  TrendingDown,
  Brain,
  Loader2,
  InfoIcon,
  BookOpenIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { refreshIndustryInsights } from "@/actions/dashboard";
import EditProfile from "./edit-profile";
import { toast } from "react-hot-toast";
import ReactMarkdown from 'react-markdown';
import { useRef } from 'react';

const DashboardView = ({ insights: initialInsights, user: initialUser }) => {
  const [insights, setInsights] = useState(initialInsights);
  const [user, setUser] = useState(initialUser);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState(null);
  const [leetcodeStats, setLeetcodeStats] = useState(null);
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState(null);
  const [geminiRec, setGeminiRec] = useState(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState(null);
  const [showGeminiRec, setShowGeminiRec] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState(null);
  const fileInputRef = useRef();

  // Fetch LeetCode stats
  const fetchLeetcodeStats = useCallback((username) => {
    if (username) {
      setLeetcodeLoading(true);
      setLeetcodeError(null);
      setLeetcodeStats(null);
      fetch(`/api/leetcode-stats?username=${username}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          setLeetcodeStats(data);
          setLeetcodeLoading(false);
        })
        .catch((err) => {
          setLeetcodeError(err.message || "Failed to fetch LeetCode stats");
          setLeetcodeLoading(false);
        });
    } else {
      setLeetcodeStats(null);
    }
  }, []);

  // Fetch Gemini recommendations
  const fetchGeminiRec = useCallback((targetRole) => {
    localStorage.removeItem('geminiRec');
    setGeminiLoading(true);
    setGeminiError(null);
    setGeminiRec(null);
    fetch('/api/gemini-recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetRole,
        leetcodeStats,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setGeminiRec(data.recommendation);
        localStorage.setItem('geminiRec', JSON.stringify(data.recommendation));
        setGeminiLoading(false);
      })
      .catch((err) => {
        setGeminiError(err.message || 'Failed to fetch Gemini recommendation');
        setGeminiLoading(false);
      });
  }, [leetcodeStats]);

  // Fetch insights
  const fetchInsights = useCallback(() => {
    fetch("/api/industry-insights")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setInsights(data))
      .catch((err) => setError(err.message || "Failed to load industry insights."));
  }, []);

  // On mount and when user changes, fetch LeetCode stats and Gemini recs
  useEffect(() => {
    fetchLeetcodeStats(user.leetcodeUsername);
  }, [user.leetcodeUsername, fetchLeetcodeStats]);

  // On mount, load cached skill gap and Gemini rec
  useEffect(() => {
    const cachedSkillGap = localStorage.getItem('skillGap');
    if (cachedSkillGap) {
      setSkillGap(JSON.parse(cachedSkillGap));
    }
    const cachedGeminiRec = localStorage.getItem('geminiRec');
    if (cachedGeminiRec) {
      setGeminiRec(JSON.parse(cachedGeminiRec));
      setShowGeminiRec(true);
    }
  }, []);

  // Transform salary data for the chart
  const salaryData = insights.salaryRanges.map((range) => ({
    name: range.role,
    min: range.min / 1000,
    max: range.max / 1000,
    median: range.median / 1000,
  }));

  const getDemandLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (outlook.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-500" };
      case "neutral":
        return { icon: LineChart, color: "text-yellow-500" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-500" };
      default:
        return { icon: LineChart, color: "text-gray-500" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(insights.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(insights.marketOutlook).color;

  // Format dates using date-fns
  const lastUpdatedDate = format(new Date(insights.lastUpdated), "dd/MM/yyyy");
  const nextUpdateDistance = formatDistanceToNow(
    new Date(insights.nextUpdate),
    { addSuffix: true }
  );

  // Skill Gap Analysis handler
  const handleSkillGapAnalysis = async () => {
    localStorage.removeItem('skillGap');
    setGapLoading(true);
    setGapError(null);
    setSkillGap(null);
    try {
      const res = await fetch("/api/gemini-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillGap: true,
          skills: user.skills,
          targetRole: user.targetRole,
          leetcodeStats,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSkillGap(data);
      localStorage.setItem('skillGap', JSON.stringify(data));
      setGapLoading(false);
    } catch (e) {
      setGapError("Failed to analyze skill gap.");
      setGapLoading(false);
    }
  };

  // Refresh user/profile after update
  const handleProfileUpdated = async () => {
    // Fetch the latest user profile from the API
    try {
      const res = await fetch("/api/user-profile");
      if (!res.ok) throw new Error(await res.text());
      const updatedUser = await res.json();
      setUser(updatedUser);
      fetchInsights();
      fetchLeetcodeStats(updatedUser.leetcodeUsername);
      // Gemini rec will auto-update due to useEffect
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to refresh profile after update");
    }
  };

  // Placeholder for PDF/DOCX text extraction
  const extractTextFromFile = async (file) => {
    if (file.type !== 'application/pdf') throw new Error('Only PDF files are supported.');
    if (typeof window === 'undefined') throw new Error('PDF parsing only supported in browser.');
    const pdfjsLib = await import('pdfjs-dist/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    setResumeFile(file);
    setResumeAnalysis(null);
    setResumeError(null);
    if (file) {
      setResumeLoading(true);
      try {
        const text = await extractTextFromFile(file);
        setResumeText(text);
        setResumeLoading(false);
        toast.success("Resume uploaded! Ready for analysis.");
      } catch (err) {
        setResumeError("Failed to extract text from resume.");
        setResumeLoading(false);
      }
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText) return;
    setResumeLoading(true);
    setResumeAnalysis(null);
    setResumeError(null);
    try {
      const res = await fetch("/api/gemini-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillGap: true,
          skills: user.skills,
          targetRole: user.targetRole,
          leetcodeStats,
          resumeText,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResumeAnalysis(data.gap || data.recommendation);
      setResumeLoading(false);
    } catch (e) {
      setResumeError("Failed to analyze resume.");
      setResumeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit Profile Section */}
      <EditProfile user={user} onProfileUpdated={handleProfileUpdated} />
      <div className="flex justify-between items-center">
        <Badge variant="outline">Last updated: {lastUpdatedDate}</Badge>
        <Button
          variant="secondary"
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const updated = await refreshIndustryInsights();
                setInsights(updated);
              } catch (e) {
                setError("Failed to refresh industry insights.");
              }
            });
          }}
          disabled={isPending}
        >
          {isPending ? (
            <><Loader2 className="animate-spin mr-2 h-4 w-4" />Refreshing...</>
          ) : (
            <>Refresh Insights</>
          )}
        </Button>
      </div>
      {error && (
        <div className="text-red-600 text-center mb-2">{error}</div>
      )}

      {/* Skill Gap Analysis & Learning Path */}
      <Card className="mb-6 shadow-lg border-2 border-primary/30 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-lg p-6">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-white drop-shadow-lg" />
            <div>
              <CardTitle className="text-white text-2xl font-bold drop-shadow">Skill Gap Analysis & Learning Path</CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                Target Role: {user?.targetRole ? (
                  <Badge className="ml-2 bg-white/20 text-white border-white/30 px-3 py-1 text-base font-semibold">{user.targetRole}</Badge>
                ) : (
                  <span className="italic text-white/70">Not set</span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleSkillGapAnalysis} disabled={gapLoading} className="mt-4 md:mt-0 bg-white text-blue-700 hover:bg-blue-100 font-semibold shadow">
            {gapLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            Analyze My Skill Gap
          </Button>
        </CardHeader>
        <CardContent>
          {gapError && <div className="text-red-600 mt-2">{gapError}</div>}
          {skillGap && (
            <div className="mt-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <InfoIcon className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-blue-700">AI Analysis</span>
              </div>
              <div className="bg-blue-100 border-l-4 border-blue-400 rounded-r-lg p-4 mb-4 text-blue-900 shadow-sm">
                {skillGap.gap}
              </div>
              <div className="mb-2 font-medium text-indigo-700 flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5" />
                Recommended Learning Resources:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {skillGap.recommendations.map((rec) => (
                  <a
                    key={rec.url}
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-white border border-indigo-200 rounded-lg p-4 shadow hover:shadow-lg transition-all duration-200 hover:bg-indigo-50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpenIcon className="h-5 w-5 text-indigo-500 group-hover:text-indigo-700 transition" />
                      <span className="font-semibold text-indigo-800 group-hover:text-indigo-900">{rec.title}</span>
                      <svg className="h-4 w-4 text-indigo-400 ml-auto group-hover:text-indigo-700 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                    <div className="text-xs text-indigo-500 truncate">{rec.url}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LeetCode Progress Section */}
      <Card className="bg-muted/80 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">LeetCode Progress</CardTitle>
          <CardDescription className="text-muted-foreground">Username: {user.leetcodeUsername}</CardDescription>
        </CardHeader>
        <CardContent>
          {leetcodeLoading ? (
            <div className="text-center py-4">Loading LeetCode stats...</div>
          ) : leetcodeError ? (
            <div className="text-red-500">{leetcodeError}</div>
          ) : leetcodeStats ? (
            <div className="space-y-2">
              <div className="text-lg font-medium">
                Total Questions Solved: <span className="text-primary font-bold">{leetcodeStats.totalSolved}</span> out of <span className="font-semibold">{leetcodeStats.totalQuestions}</span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Easy: {leetcodeStats.easySolved}</span>
                <span>Medium: {leetcodeStats.mediumSolved}</span>
                <span>Hard: {leetcodeStats.hardSolved}</span>
              </div>
              <Button
                variant="default"
                className="mt-4"
                onClick={() => {
                  setShowGeminiRec(true);
                  fetchGeminiRec(user.targetRole);
                }}
                disabled={geminiLoading}
              >
                {geminiLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Loading Recommendations...</> : <>Get Gemini AI Recommendations</>}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No LeetCode stats available for this user.</p>
              <p>Please ensure your LeetCode username is set in your profile.</p>
            </div>
          )}
          {/* Gemini AI Recommendations Section */}
          {showGeminiRec && (
            <div className="mt-6 bg-background/80 rounded-lg p-4 border border-muted">
              <div className="font-semibold text-primary mb-2">Gemini AI Recommendations</div>
              {geminiError ? (
                <div className="text-red-500">{geminiError}</div>
              ) : geminiRec ? (
                <ReactMarkdown className="prose prose-invert max-w-none">{geminiRec}</ReactMarkdown>
              ) : (
                <div className="text-muted-foreground">Loading recommendations...</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Resume Upload and Analysis Section */}
      <Card className="bg-muted/80 border-none shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">Upload Resume for AI Analysis</CardTitle>
          <CardDescription className="text-muted-foreground">Upload your resume (PDF only) to get a personalized skill gap analysis based on your actual experience!</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleResumeUpload}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={resumeLoading}
            className="mb-2"
          >
            {resumeLoading ? 'Uploading...' : resumeFile ? 'Change Resume' : 'Upload Resume (PDF)'}
          </Button>
          {resumeFile && !resumeLoading && (
            <Button
              variant="default"
              onClick={handleAnalyzeResume}
              className="ml-2"
              disabled={resumeLoading || !resumeText}
            >
              {resumeLoading ? 'Analyzing...' : 'Analyze Resume'}
            </Button>
          )}
          {resumeError && <div className="text-red-500 mt-2">{resumeError}</div>}
          {resumeAnalysis && (
            <div className="mt-6 bg-background/80 rounded-lg p-4 border border-muted max-h-96 overflow-y-auto">
              <div className="font-semibold text-primary mb-2">AI Resume Skill Gap Analysis</div>
              <ReactMarkdown className="prose prose-invert max-w-none">{resumeAnalysis}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Market Outlook
            </CardTitle>
            <OutlookIcon className={`h-4 w-4 ${outlookColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.marketOutlook}</div>
            <p className="text-xs text-muted-foreground">
              Next update {nextUpdateDistance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Industry Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.growthRate.toFixed(1)}%
            </div>
            <Progress value={insights.growthRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Level</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.demandLevel}</div>
            <div
              className={`h-2 w-full rounded-full mt-2 ${getDemandLevelColor(
                insights.demandLevel
              )}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {insights.topSkills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Ranges Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Salary Ranges by Role</CardTitle>
          <CardDescription>
            Displaying minimum, median, and maximum salaries (in thousands)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-md">
                          <p className="font-medium">{label}</p>
                          {payload.map((item) => (
                            <p key={item.name} className="text-sm">
                              {item.name}: ${item.value}K
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="min" fill="#94a3b8" name="Min Salary (K)" />
                <Bar dataKey="median" fill="#64748b" name="Median Salary (K)" />
                <Bar dataKey="max" fill="#475569" name="Max Salary (K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Industry Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Key Industry Trends</CardTitle>
            <CardDescription>
              Current trends shaping the industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {insights.keyTrends.map((trend, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Skills</CardTitle>
            <CardDescription>Skills to consider developing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.recommendedSkills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
