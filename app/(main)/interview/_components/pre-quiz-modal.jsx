import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PreQuizModal({ open, onStart, onOpenChange }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const handleStart = () => {
    if (!company.trim() || !role.trim()) {
      setError("Please enter both company and role.");
      return;
    }
    setError("");
    onStart(company.trim(), role.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="pre-quiz-desc">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Prepare for Your Dream Job</DialogTitle>
          <DialogDescription id="pre-quiz-desc">
            Enter your target company and role to generate a personalized mock interview quiz.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="block font-medium mb-1" htmlFor="company">Target Company</label>
            <Input id="company" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g., Google, Amazon, TCS" />
          </div>
          <div>
            <label className="block font-medium mb-1" htmlFor="role">Target Role</label>
            <Input id="role" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., Software Engineer, Data Analyst" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button className="w-full mt-2" onClick={handleStart}>Start Quiz</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 