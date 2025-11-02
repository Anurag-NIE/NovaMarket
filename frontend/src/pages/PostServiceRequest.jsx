// frontend/src/pages/PostServiceRequest.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";
import api from "../utils/api";

const PostServiceRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    deadline: "",
    skills_required: [],
    experience_level: "intermediate",
    attachments: [],
  });

  const categories = [
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Data Science",
    "Machine Learning",
    "DevOps",
    "Content Writing",
    "Digital Marketing",
    "Video Editing",
    "Graphic Design",
    "Consulting",
  ];

  const availableSkills = [
    "React",
    "Node.js",
    "Python",
    "Django",
    "FastAPI",
    "PostgreSQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Kubernetes",
    "UI/UX Design",
    "Figma",
    "Adobe XD",
    "Content Writing",
    "SEO",
    "Digital Marketing",
    "Video Editing",
    "Data Science",
    "Machine Learning",
    "TensorFlow",
    "Vue.js",
    "Angular",
    "TypeScript",
    "GraphQL",
    "Redis",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      toast.error("Please enter a valid budget");
      return;
    }
    if (formData.skills_required.length === 0) {
      toast.error("Please select at least one required skill");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/service-requests", {
        ...formData,
        budget: parseFloat(formData.budget),
      });

      toast.success("Service request posted successfully!");
      setTimeout(() => {
        navigate("/buyer-dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error posting request:", error);
      toast.error(
        error.response?.data?.detail || "Failed to post service request"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills_required: prev.skills_required.includes(skill)
        ? prev.skills_required.filter((s) => s !== skill)
        : [...prev.skills_required, skill],
    }));
  };

  const addCustomSkill = () => {
    if (
      skillInput.trim() &&
      !formData.skills_required.includes(skillInput.trim())
    ) {
      setFormData({
        ...formData,
        skills_required: [...formData.skills_required, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills_required: formData.skills_required.filter((s) => s !== skill),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Post a Service Request
          </h1>
          <p className="text-muted-foreground text-lg">
            Describe your project and get proposals from talented freelancers
          </p>
        </div>

        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase size={24} className="text-purple-600" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Project Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Build a responsive e-commerce website"
                  required
                  className="h-12"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-base font-semibold"
                >
                  Project Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your project requirements, goals, and any specific details..."
                  required
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base font-semibold">
                  Category *
                </Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full h-12 px-4 border border-input bg-background rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget & Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-base font-semibold">
                    Budget (USD) *
                  </Label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      placeholder="1000"
                      min="1"
                      step="0.01"
                      required
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-base font-semibold">
                    Deadline (Optional)
                  </Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, deadline: e.target.value })
                      }
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label
                  htmlFor="experience_level"
                  className="text-base font-semibold"
                >
                  Required Experience Level *
                </Label>
                <select
                  id="experience_level"
                  value={formData.experience_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience_level: e.target.value,
                    })
                  }
                  className="w-full h-12 px-4 border border-input bg-background rounded-md"
                  required
                >
                  <option value="beginner">Beginner (Entry Level)</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert (Advanced)</option>
                </select>
              </div>

              {/* Skills Required */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Skills Required * (Click to select)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => {
                    const isSelected = formData.skills_required.includes(skill);
                    return (
                      <Badge
                        key={skill}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                          isSelected
                            ? "bg-blue-600 hover:bg-blue-700 shadow-md"
                            : "hover:bg-blue-50 dark:hover:bg-blue-950"
                        }`}
                        onClick={() => toggleSkill(skill)}
                      >
                        {isSelected && (
                          <CheckCircle size={14} className="mr-1" />
                        )}
                        {skill}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.skills_required.length} skills
                </p>
              </div>

              {/* Add Custom Skill */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Add Custom Skills
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addCustomSkill())
                    }
                    placeholder="Add a custom skill"
                    className="h-12"
                  />
                  <Button
                    type="button"
                    onClick={addCustomSkill}
                    className="h-12"
                  >
                    <Plus size={18} className="mr-2" />
                    Add
                  </Button>
                </div>
                {formData.skills_required.filter(
                  (s) => !availableSkills.includes(s)
                ).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills_required
                      .filter((s) => !availableSkills.includes(s))
                      .map((skill, idx) => (
                        <Badge
                          key={idx}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2"
                          >
                            <X size={14} />
                          </button>
                        </Badge>
                      ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/buyer-dashboard")}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Briefcase size={18} className="mr-2" />
                      Post Service Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostServiceRequest;
