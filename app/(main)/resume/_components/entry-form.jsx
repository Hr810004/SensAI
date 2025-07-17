// app/resume/_components/entry-form.jsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { entrySchema, educationEntrySchema } from "@/app/lib/schema";
import { Sparkles, PlusCircle, X, Pencil, Save, Loader2 } from "lucide-react";
import { improveWithAI } from "@/actions/resume";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  const date = parse(dateString, "yyyy-MM", new Date());
  return format(date, "MMM yyyy");
};

export function EntryForm({ type, entries, onChange }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  const isEducation = type === "Education";

  const {
    register,
    handleSubmit: handleValidation,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(isEducation ? educationEntrySchema : entrySchema),
    defaultValues: isEducation
      ? {
          degree: "",
          institution: "",
          fieldOfStudy: "",
          startDate: "",
          endDate: "",
          current: false,
          points: ["", "", "", ""], // Up to 4 points, optional for education
        }
      : {
          title: "",
          organization: "",
          startDate: "",
          endDate: "",
          points: ["", "", "", ""], // Up to 4 points
          current: false,
          links: [],
        },
  });

  const current = watch("current");
  const links = watch("links") || [];
  const points = watch("points") || ["", "", "", ""];

  const handleImproveWithAI = async (entryIndex) => {
    const entry = entries[entryIndex];
    if (!entry || !entry.points || entry.points.length === 0) {
      toast.error("Please add some points first before improving with AI");
      return;
    }

    setIsImproving(true);
    try {
      const response = await improveWithAI({
        type: type,
        title: entry.title || entry.degree,
        organization: entry.organization || entry.institution,
        currentPoints: entry.points,
      });

      if (response.improvedPoints) {
        const updatedEntries = [...entries];
        updatedEntries[entryIndex] = {
          ...updatedEntries[entryIndex],
          points: response.improvedPoints,
        };
        onChange(updatedEntries);
        toast.success("Points improved with AI!");
      }
    } catch (error) {
      console.error("AI improvement error:", error);
      toast.error("Failed to improve points with AI");
    } finally {
      setIsImproving(false);
    }
  };

  const handleAdd = handleValidation((data) => {
    // Validate project links if present
    if (type === "Project" && data.links && data.links.length > 0) {
      for (const link of data.links) {
        if (link.label && !link.url) {
          toast.error("Please provide a URL for all link labels");
          return;
        }
        if (link.url && !link.url.startsWith("http")) {
          toast.error("Please enter valid URLs starting with http:// or https://");
          return;
        }
      }
    }

    // Validate minimum points for projects
    const filteredPoints = (data.points || []).filter((p) => p && p.trim() !== "");
    if (type === "Project" && filteredPoints.length < 3) {
      toast.error("Projects require at least 3 points");
      return;
    }

    const formattedEntry = {
      ...data,
      startDate: formatDisplayDate(data.startDate),
      endDate: data.current ? "" : formatDisplayDate(data.endDate),
      links: data.links || [], // Include links in the entry
      points: filteredPoints,
    };

    onChange([...entries, formattedEntry]);

    reset();
    setIsAdding(false);
  });

  const handleDelete = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(newEntries);
  };

  // Add/remove links for projects
  const addLink = () => {
    const currentLinks = watch("links") || [];
    setValue("links", [...currentLinks, { label: "", url: "" }]);
  };

  const removeLink = (index) => {
    const currentLinks = watch("links") || [];
    const newLinks = currentLinks.filter((_, i) => i !== index);
    setValue("links", newLinks);
  };

  const updateLink = (index, field, value) => {
    const currentLinks = watch("links") || [];
    const newLinks = [...currentLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setValue("links", newLinks);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {entries.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isEducation
                  ? `${item.degree} @ ${item.institution}`
                  : `${item.title} @ ${item.organization}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImproveWithAI(index)}
                  disabled={isImproving || !item.points || item.points.length === 0}
                >
                  {isImproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Improve with AI
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => handleDelete(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {item.current
                  ? `${item.startDate} - Present`
                  : `${item.startDate} - ${item.endDate}`}
              </p>
              {isEducation && item.fieldOfStudy && (
                <p className="text-sm mt-1">Field: {item.fieldOfStudy}</p>
              )}
              {isEducation && item.gpa && (
                <p className="text-sm mt-1">GPA: {item.gpa}</p>
              )}
              {!isEducation && type === "Project" && item.links && item.links.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Links:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {item.links.map((link, linkIndex) => (
                      <span key={linkIndex} className="text-sm text-blue-600">
                        {link.label}: {link.url}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.points && item.points.length > 0 && (
                <ul className="mt-2 list-disc ml-4 text-sm">
                  {item.points.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add {type}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEducation ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Degree (e.g., B.Tech, M.Sc)"
                      {...register("degree")}
                      error={errors.degree}
                    />
                    {errors.degree && (
                      <p className="text-sm text-red-500">{errors.degree.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Institution/University"
                      {...register("institution")}
                      error={errors.institution}
                    />
                    {errors.institution && (
                      <p className="text-sm text-red-500">{errors.institution.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Field of Study (optional)"
                    {...register("fieldOfStudy")}
                    error={errors.fieldOfStudy}
                  />
                  {errors.fieldOfStudy && (
                    <p className="text-sm text-red-500">{errors.fieldOfStudy.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="GPA (optional, e.g., 9.2/10 or 3.8/4)"
                    {...register("gpa")}
                    error={errors.gpa}
                  />
                  {errors.gpa && (
                    <p className="text-sm text-red-500">{errors.gpa.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      type="month"
                      {...register("startDate")}
                      error={errors.startDate}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="month"
                      {...register("endDate")}
                      disabled={watch("current")}
                      error={errors.endDate}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="current"
                    {...register("current")}
                    onChange={(e) => {
                      setValue("current", e.target.checked);
                      if (e.target.checked) {
                        setValue("endDate", "");
                      }
                    }}
                  />
                  <label htmlFor="current">Current Education</label>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      placeholder={isEducation ? "Degree" : "Title"}
                      {...register(isEducation ? "degree" : "title")}
                      error={errors[isEducation ? "degree" : "title"]}
                    />
                    {errors[isEducation ? "degree" : "title"] && (
                      <p className="text-sm text-red-500">{errors[isEducation ? "degree" : "title"].message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder={isEducation ? "Institution/University" : "Organization"}
                      {...register(isEducation ? "institution" : "organization")}
                      error={errors[isEducation ? "institution" : "organization"]}
                    />
                    {errors[isEducation ? "institution" : "organization"] && (
                      <p className="text-sm text-red-500">{errors[isEducation ? "institution" : "organization"].message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      type="month"
                      {...register("startDate")}
                      error={errors.startDate}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="month"
                      {...register("endDate")}
                      disabled={current}
                      error={errors.endDate}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="current"
                    {...register("current")}
                    onChange={(e) => {
                      setValue("current", e.target.checked);
                      if (e.target.checked) {
                        setValue("endDate", "");
                      }
                    }}
                  />
                  <label htmlFor="current">Current {type}</label>
                </div>

                {/* Links section for projects */}
                {type === "Project" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Links</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLink}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                    {links.map((link, linkIndex) => (
                      <div key={linkIndex} className="flex gap-2 items-center">
                        <Input
                          placeholder="Label (e.g., GitHub, Demo)"
                          value={link.label || ""}
                          onChange={(e) => updateLink(linkIndex, "label", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="URL"
                          value={link.url || ""}
                          onChange={(e) => updateLink(linkIndex, "url", e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeLink(linkIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

              </>
            )}
            {/* Points input fields for all types */}
            <div className="space-y-2">
              {[0, 1, 2, 3].map((idx) => {
                let placeholder = `Point ${idx + 1} (bullet)`;
                if (type === "Experience") {
                  if (idx === 0) placeholder = "Key responsibility or achievement";
                  if (idx === 1) placeholder = "Technology/tools used";
                  if (idx === 2) placeholder = "Quantifiable impact/result";
                  if (idx === 3) placeholder = "Future scope or learning";
                } else if (type === "Education") {
                  if (idx === 0) placeholder = "Relevant coursework or subject";
                  if (idx === 1) placeholder = "Project or achievement";
                  if (idx === 2) placeholder = "Extracurricular or leadership";
                  if (idx === 3) placeholder = "Future scope or learning";
                } else if (type === "Project") {
                  if (idx === 0) placeholder = "Project goal or feature";
                  if (idx === 1) placeholder = "Technology/tools used";
                  if (idx === 2) placeholder = "Impact or result";
                  if (idx === 3) placeholder = "Future scope or learning";
                }
                return (
                  <Input
                    key={idx}
                    placeholder={placeholder}
                    {...register(`points.${idx}`)}
                    error={errors.points?.[idx]}
                  />
                );
              })}
              <p className="text-xs text-muted-foreground mt-1">
                {type === "Project"
                  ? "You can add up to 4 points. Minimum 3 points required for projects."
                  : "You can add up to 4 points. All are optional for education."
                }
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setIsAdding(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAdd}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isAdding && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setIsAdding(true)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add {type}
        </Button>
      )}
    </div>
  );
}

// AchievementForm component for handling achievements with optional links
export function AchievementForm({ achievements, onChange }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAchievement, setNewAchievement] = useState({ points: ["", "", "", ""], url: "" });

  const handleAdd = () => {
    const filteredPoints = (newAchievement.points || []).filter((p) => p && p.trim() !== "");
    if (filteredPoints.length === 0) {
      toast.error("At least one point is required");
      return;
    }
    if (newAchievement.url && !newAchievement.url.startsWith("http")) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }
    onChange([...achievements, { points: filteredPoints, url: newAchievement.url }]);
    setNewAchievement({ points: ["", "", "", ""], url: "" });
    setIsAdding(false);
  };

  const handleDelete = (index) => {
    const newAchievements = achievements.filter((_, i) => i !== index);
    onChange(newAchievements);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {achievements.map((achievement, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Achievement {index + 1}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => handleDelete(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="mt-2 list-disc ml-4 text-sm">
                {achievement.points && achievement.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
              {achievement.url && (
                <p className="mt-2 text-sm text-blue-600">
                  <a href={achievement.url} target="_blank" rel="noopener noreferrer">
                    {achievement.url}
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add Achievement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {[0, 1, 2, 3].map((idx) => (
                <Input
                  key={idx}
                  placeholder={`Point ${idx + 1} (bullet)`}
                  value={newAchievement.points[idx] || ""}
                  onChange={(e) => {
                    const updated = [...newAchievement.points];
                    updated[idx] = e.target.value;
                    setNewAchievement({ ...newAchievement, points: updated });
                  }}
                  className="h-10"
                />
              ))}
              <p className="text-xs text-muted-foreground mt-1">You can add up to 4 points. At least one is required.</p>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Optional: URL (e.g., certificate link, profile link)"
                value={newAchievement.url}
                onChange={(e) => setNewAchievement({ ...newAchievement, url: e.target.value })}
                type="url"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewAchievement({ points: ["", "", "", ""], url: "" });
                setIsAdding(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAdd}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Achievement
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isAdding && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setIsAdding(true)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Achievement
        </Button>
      )}
    </div>
  );
}
