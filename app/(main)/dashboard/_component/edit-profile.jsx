import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function EditProfile({ user, onProfileUpdated }) {
  const [form, setForm] = useState({
    industry: user.industry || "",
    subIndustry: user.subIndustry || "",
    experience: user.experience || "",
    skills: user.skills ? user.skills.join(", ") : "",
    bio: user.bio || "",
    targetRole: user.targetRole || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean) }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Profile updated!");
      onProfileUpdated && onProfileUpdated();
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" value={form.industry} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="subIndustry">Specialization</Label>
            <Input id="subIndustry" name="subIndustry" value={form.subIndustry} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="experience">Years of Experience</Label>
            <Input id="experience" name="experience" type="number" min="0" max="50" value={form.experience} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="skills">Skills</Label>
            <Input id="skills" name="skills" value={form.skills} onChange={handleChange} placeholder="e.g., Python, JavaScript, Project Management" />
            <p className="text-sm text-muted-foreground">Separate multiple skills with commas</p>
          </div>
          <div>
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea id="bio" name="bio" value={form.bio} onChange={handleChange} className="h-24" />
          </div>
          <div>
            <Label htmlFor="targetRole">Target Role</Label>
            <Input id="targetRole" name="targetRole" value={form.targetRole} onChange={handleChange} />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 