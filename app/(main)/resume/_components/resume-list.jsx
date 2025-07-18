"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Eye, Trash2, Copy, FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteResume, duplicateResume } from "@/actions/resume";

export default function ResumeList({ resumes }) {
  const router = useRouter();

  const handleDelete = async (id) => {
    try {
      await deleteResume(id);
      toast.success("Resume deleted successfully!");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to delete resume");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateResume(id);
      toast.success("Resume duplicated!");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to duplicate resume");
    }
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content || "");
      toast.success("LaTeX copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy LaTeX");
    }
  };

  if (!resumes?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Resumes Yet</CardTitle>
          <CardDescription>
            Create your first resume to get started
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {resumes.map((resume) => (
        <Card key={resume.id} className="group relative ">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl gradient-title">
                  {resume.title || "Untitled Resume"}
                </CardTitle>
                <CardDescription>
                  Created {format(new Date(resume.createdAt), "PPP")}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push(`/resume/${resume.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(resume.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDuplicate(resume.id)}
                >
                  <FilePlus2 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your resume titled '{resume.title || "Untitled Resume"}'.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(resume.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
} 