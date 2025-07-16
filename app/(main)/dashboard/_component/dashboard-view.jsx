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
  const [resumeTargetCompany, setResumeTargetCompany] = useState("");
  const [resumeTargetRole, setResumeTargetRole] = useState("");
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
      // Auto-trigger skill gap analysis after profile update
      handleSkillGapAnalysis();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to refresh profile after update");
    }
  };

  // Remove all pdfjs-dist imports and PDF parsing logic
  // Update handleResumeUpload to send the file directly to the backend
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    setResumeFile(file);
    setResumeAnalysis(null);
    setResumeError(null);
    if (file) {
      setResumeLoading(true);
      try {
        // Send the image as FormData to the backend
        const formData = new FormData();
        formData.append('resumeImage', file);
        if (resumeTargetRole) {
          formData.append('targetRole', resumeTargetRole);
        }
        if (resumeTargetCompany) {
          formData.append('targetCompany', resumeTargetCompany);
        }
        const res = await fetch('/api/gemini-recommend', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setResumeAnalysis(data.gap || data.recommendation);
        setResumeLoading(false);
        toast.success('Resume image uploaded and analyzed!');
      } catch (err) {
        setResumeError('Failed to analyze resume image.');
        setResumeLoading(false);
      }
    }
  };
  // Remove extractTextFromFile and handleAnalyzeResume
  // Update the UI to only show the upload button and analysis result

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

      {/* Resume Upload and Analysis Section (moved up) */}
      <Card className="bg-muted/80 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">Upload Resume Image for AI Analysis</CardTitle>
          <CardDescription className="text-muted-foreground">Upload an image of your resume (PNG, JPG, JPEG) to get a personalized skill gap analysis based on your actual experience!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label htmlFor="resume-target-role" className="block text-sm font-medium text-primary mb-1">Target Role (optional)</label>
            <input
              id="resume-target-role"
              type="text"
              value={resumeTargetRole}
              onChange={e => setResumeTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer, Data Scientist, etc."
              className="w-full px-3 py-2 border rounded-md bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="resume-target-company" className="block text-sm font-medium text-primary mb-1">Target Company (optional)</label>
            <input
              id="resume-target-company"
              type="text"
              value={resumeTargetCompany}
              onChange={e => setResumeTargetCompany(e.target.value)}
              placeholder="e.g. Google, Microsoft, etc."
              className="w-full px-3 py-2 border rounded-md bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
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
            {resumeLoading ? 'Uploading...' : resumeFile ? 'Change Resume Image' : 'Upload Resume Image (PNG, JPG, JPEG)'}
          </Button>
          {resumeError && <div className="text-red-500 mt-2">{resumeError}</div>}
          {resumeAnalysis && (
            <div className="mt-6 bg-background/80 rounded-lg p-4 border border-muted max-h-96 overflow-y-auto">
              <div className="font-semibold text-primary mb-2">AI Resume Skill Gap Analysis</div>
              <ReactMarkdown className="prose prose-invert max-w-none">{resumeAnalysis}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Gap Analysis & Learning Path (styled like Resume Upload) */}
      <Card className="bg-muted/80 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">Skill Gap Analysis & Learning Path</CardTitle>
          <CardDescription className="text-muted-foreground">
            Target Role: {user?.targetRole ? (
              <Badge className="ml-2 bg-white/20 text-white border-white/30 px-3 py-1 text-base font-semibold">{user.targetRole}</Badge>
            ) : (
              <span className="italic text-white/70">Not set</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="default"
            className="mt-4"
            onClick={handleSkillGapAnalysis}
            disabled={gapLoading}
          >
            {gapLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            Analyze My Skill Gap
          </Button>
          {gapError && <div className="text-red-600 mt-2">{gapError}</div>}
          {skillGap && (
            <div className="mt-6 bg-background/80 rounded-lg p-4 border border-muted max-h-96 overflow-y-auto">
              <div className="font-semibold text-primary mb-2">AI Skill Gap Analysis</div>
              <ReactMarkdown className="prose prose-invert max-w-none">{skillGap.gap}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LeetCode Progress Section (moved down) */}
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
