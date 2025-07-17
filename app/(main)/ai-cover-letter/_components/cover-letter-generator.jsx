"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateCoverLetter } from "@/actions/cover-letter";
import useFetch from "@/hooks/use-fetch";
import { coverLetterSchema } from "@/app/lib/schema";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CoverLetterGenerator() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(coverLetterSchema),
    defaultValues: {
      tone: "professional",
      focus: "experience",
    },
  });

  const {
    loading: generating,
    fn: generateLetterFn,
    data: generatedLetter,
  } = useFetch(generateCoverLetter);

  // Update content when letter is generated
  useEffect(() => {
    if (generatedLetter) {
      toast.success("Cover letter generated successfully!");
      router.push(`/ai-cover-letter/${generatedLetter.id}`);
      reset();
    }
  }, [generatedLetter]);

  const onSubmit = async (data) => {
    try {
      await generateLetterFn(data);
    } catch (error) {
      toast.error(error.message || "Failed to generate cover letter");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Provide information about the position you're applying for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Job Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Job Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    {...register("companyName")}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="Enter job title"
                    {...register("jobTitle")}
                  />
                  {errors.jobTitle && (
                    <p className="text-sm text-red-500">
                      {errors.jobTitle.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the job description here"
                  className="h-32"
                  {...register("jobDescription")}
                />
                {errors.jobDescription && (
                  <p className="text-sm text-red-500">
                    {errors.jobDescription.message}
                  </p>
                )}
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicantName">Your Name</Label>
                  <Input
                    id="applicantName"
                    placeholder="Enter your full name"
                    {...register("applicantName")}
                  />
                  {errors.applicantName && (
                    <p className="text-sm text-red-500">
                      {errors.applicantName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicantEmail">Email</Label>
                  <Input
                    id="applicantEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    {...register("applicantEmail")}
                  />
                  {errors.applicantEmail && (
                    <p className="text-sm text-red-500">
                      {errors.applicantEmail.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicantPhone">Phone (Optional)</Label>
                  <Input
                    id="applicantPhone"
                    placeholder="+1 234 567 8900"
                    {...register("applicantPhone")}
                  />
                  {errors.applicantPhone && (
                    <p className="text-sm text-red-500">
                      {errors.applicantPhone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicantLocation">Location (Optional)</Label>
                  <Input
                    id="applicantLocation"
                    placeholder="City, State"
                    {...register("applicantLocation")}
                  />
                  {errors.applicantLocation && (
                    <p className="text-sm text-red-500">
                      {errors.applicantLocation.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicantLinkedin">LinkedIn URL (Optional)</Label>
                <Input
                  id="applicantLinkedin"
                  placeholder="https://linkedin.com/in/your-profile"
                  {...register("applicantLinkedin")}
                />
                {errors.applicantLinkedin && (
                  <p className="text-sm text-red-500">
                    {errors.applicantLinkedin.message}
                  </p>
                )}
              </div>
            </div>

            {/* Professional Background Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Background</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience (Optional)</Label>
                  <Input
                    id="yearsOfExperience"
                    placeholder="e.g., 3 years"
                    {...register("yearsOfExperience")}
                  />
                  {errors.yearsOfExperience && (
                    <p className="text-sm text-red-500">
                      {errors.yearsOfExperience.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keySkills">Key Skills (Optional)</Label>
                  <Input
                    id="keySkills"
                    placeholder="e.g., React, Node.js, Python"
                    {...register("keySkills")}
                  />
                  {errors.keySkills && (
                    <p className="text-sm text-red-500">
                      {errors.keySkills.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relevantExperience">Relevant Experience Summary (Optional)</Label>
                <Textarea
                  id="relevantExperience"
                  placeholder="Brief summary of your most relevant experience for this role"
                  className="h-24"
                  {...register("relevantExperience")}
                />
                {errors.relevantExperience && (
                  <p className="text-sm text-red-500">
                    {errors.relevantExperience.message}
                  </p>
                )}
              </div>
            </div>

            {/* Cover Letter Customization */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cover Letter Style</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select onValueChange={(value) => setValue("tone", value)} defaultValue={watch("tone")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="confident">Confident</SelectItem>
                      <SelectItem value="humble">Humble</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="focus">Focus Area</Label>
                  <Select onValueChange={(value) => setValue("focus", value)} defaultValue={watch("focus")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select focus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="experience">Experience</SelectItem>
                      <SelectItem value="skills">Skills</SelectItem>
                      <SelectItem value="culture">Culture Fit</SelectItem>
                      <SelectItem value="growth">Growth Potential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Cover Letter"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
