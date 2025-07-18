import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getResumeById } from "@/actions/resume";
import ResumeBuilder from "../_components/resume-builder";

export default async function ResumeDetailPage({ params }) {
  const { id } = params;
  const resume = await getResumeById(id);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <Link href="/resume">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Resumes
          </Button>
        </Link>
        <h1 className="text-6xl font-bold hero-gradient-cyber animate-gradient text-transparent bg-clip-text leading-[1.25] mb-4 overflow-visible">
          {resume?.title || "Untitled Resume"}
        </h1>
      </div>
      <ResumeBuilder initialContent={resume?.content} resumeId={id} />
    </div>
  );
} 