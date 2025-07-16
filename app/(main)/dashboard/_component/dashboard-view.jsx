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
import { useEffect } from "react";
import EditProfile from "./edit-profile";
import { toast } from "react-hot-toast";

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

  // Fetch LeetCode stats
  const fetchLeetcodeStats = useCallback((username) => {
    if (username) {
      setLeetcodeLoading(true);
      setLeetcodeError(null);
      setLeetcodeStats(null);
      fetch(`/api/leetcode-stats?username=${username}&topics=true`)
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          setLeetcodeStats(data.topics || []);
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
  const fetchGeminiRec = useCallback((targetRole, leetcodeTopics) => {
    if (targetRole) {
      setGeminiLoading(true);
      setGeminiError(null);
      setGeminiRec(null);
      fetch("/api/gemini-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          ...(leetcodeTopics ? { leetcodeTopics } : {}),
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          setGeminiRec(data.recommendation);
          setGeminiLoading(false);
        })
        .catch((err) => {
          setGeminiError(err.message || "Failed to get AI recommendation");
          setGeminiLoading(false);
        });
    }
  }, []);

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

  useEffect(() => {
    fetchGeminiRec(user.targetRole, leetcodeStats);
  }, [user.targetRole, leetcodeStats, fetchGeminiRec]);

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
          ...(leetcodeStats ? { leetcodeTopics: leetcodeStats } : {}),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSkillGap(data);
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

      {/* LeetCode Stats Section */}
      {user.leetcodeUsername && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>LeetCode Progress</CardTitle>
            <CardDescription>
              Username: <span className="font-mono font-semibold">{user.leetcodeUsername}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leetcodeLoading && <div>Loading LeetCode stats...</div>}
            {leetcodeError && <div className="text-red-600">{leetcodeError}</div>}
            {leetcodeStats && (
              <div className="space-y-2">
                <div className="text-lg font-medium">
                  Total Questions Solved: <span className="text-primary font-bold">{leetcodeStats.reduce((sum, topic) => sum + topic.totalSolved, 0)}</span> out of <span className="font-semibold">{leetcodeStats.reduce((sum, topic) => sum + topic.totalQuestions, 0)}</span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Easy: {leetcodeStats.reduce((sum, topic) => sum + topic.easySolved, 0)}</span>
                  <span>Medium: {leetcodeStats.reduce((sum, topic) => sum + topic.mediumSolved, 0)}</span>
                  <span>Hard: {leetcodeStats.reduce((sum, topic) => sum + topic.hardSolved, 0)}</span>
                </div>
              </div>
            )}
            {/* LeetCode Topic Breakdown Section */}
            {leetcodeStats && leetcodeStats.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2 text-indigo-700 flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5" />
                  LeetCode Topic-wise Progress
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={leetcodeStats}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tagName" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={80} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="problemsSolved" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span>Each bar shows how many problems you have solved in that topic.</span>
                </div>
              </div>
            )}
            {/* Gemini AI Recommendation */}
            {leetcodeStats && (
              <div className="mt-6">
                <div className="font-semibold mb-2 text-indigo-700 flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5" />
                  Gemini AI Recommendations
                </div>
                {geminiLoading && <div>Loading recommendations...</div>}
                {geminiError && <div className="text-red-600">{geminiError}</div>}
                {geminiRec && (
                  <div className="bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg p-4 text-indigo-900 shadow-sm animate-fade-in">
                    {geminiRec}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
