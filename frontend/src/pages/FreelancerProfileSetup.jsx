









// frontend/src/pages/FreelancerProfileSetup.jsx - COMPLETE FILE
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  UserCircle,
  Briefcase,
  DollarSign,
  Award,
  Globe,
  CheckCircle,
  MapPin,
  Plus,
  X,
  Edit,
  Save,
} from "lucide-react";
import api from "../utils/api";
import ProfileViewMode from "../components/ProfileViewMode";

const FreelancerProfileSetup = ({ user }) => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(!userId);
  const [viewMode, setViewMode] = useState(false);

  const [profile, setProfile] = useState({
    title: "",
    bio: "",
    skills: [],
    experience_years: 0,
    hourly_rate: "",
    portfolio_url: "",
    certifications: [],
    categories: [],
    languages: [],
    education: [],
    portfolio: [],
    location: "",
    website: "",
    availability: "available",
  });

  const [skillInput, setSkillInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [educationForm, setEducationForm] = useState({
    degree: "",
    institution: "",
    year: "",
  });
  const [certificationForm, setCertificationForm] = useState({
    name: "",
    issuer: "",
    year: "",
  });
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    image_url: "",
    project_url: "",
  });

  const availableSkills = [
    "React", "Node.js", "Python", "Django", "FastAPI", "PostgreSQL",
    "MongoDB", "AWS", "Docker", "Kubernetes", "UI/UX Design", "Figma",
    "Adobe XD", "Content Writing", "SEO", "Digital Marketing",
    "Video Editing", "Data Science", "Machine Learning", "TensorFlow",
    "Vue.js", "Angular", "TypeScript", "GraphQL", "Redis",
  ];

  const availableCategories = [
    "Web Development", "Mobile Development", "UI/UX Design",
    "Data Science", "Machine Learning", "DevOps", "Content Writing",
    "Digital Marketing", "Video Editing", "Graphic Design", "Consulting",
  ];

  useEffect(() => {
    if (userId) {
      loadProfile(userId);
      setViewMode(true);
    } else {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async (id = null) => {
    try {
      setFetchingProfile(true);
      const endpoint = id ? `/freelancer/profile/${id}` : "/freelancer/profile";
      const response = await api.get(endpoint);

      if (response.data.profile) {
        const profileData = response.data.profile;
        setProfile({
          title: profileData.title || "",
          bio: profileData.bio || "",
          skills: Array.isArray(profileData.skills) ? profileData.skills : [],
          experience_years: profileData.experience_years || 0,
          hourly_rate: profileData.hourly_rate || "",
          portfolio_url: profileData.portfolio_url || "",
          certifications: Array.isArray(profileData.certifications) ? profileData.certifications : [],
          categories: Array.isArray(profileData.categories) ? profileData.categories : [],
          languages: Array.isArray(profileData.languages) ? profileData.languages : [],
          education: Array.isArray(profileData.education) ? profileData.education : [],
          portfolio: Array.isArray(profileData.portfolio) ? profileData.portfolio : [],
          location: profileData.location || "",
          website: profileData.website || "",
          availability: profileData.availability || "available",
        });
        if (!userId) {
          setViewMode(true);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      if (error.response?.status !== 404) {
        toast.error("Failed to load profile");
      }
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile.title?.trim()) {
      toast.error("Professional title is required");
      return;
    }
    if (!profile.bio?.trim()) {
      toast.error("Bio is required");
      return;
    }
    if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }
    if (!profile.hourly_rate || parseFloat(profile.hourly_rate) <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/freelancer/profile", {
        ...profile,
        hourly_rate: parseFloat(profile.hourly_rate),
        experience_years: parseInt(profile.experience_years) || 0,
      });

      toast.success(response.data.message || "Profile saved successfully!");
      setIsEditing(false);
      setViewMode(true);
      
      if (!userId) {
        setTimeout(() => {
          navigate("/seller-dashboard");
        }, 1500);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error.response?.data?.detail || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    setProfile((prev) => {
      const currentSkills = Array.isArray(prev.skills) ? prev.skills : [];
      return {
        ...prev,
        skills: currentSkills.includes(skill)
          ? currentSkills.filter((s) => s !== skill)
          : [...currentSkills, skill],
      };
    });
  };

  const toggleCategory = (category) => {
    setProfile((prev) => {
      const currentCategories = Array.isArray(prev.categories) ? prev.categories : [];
      return {
        ...prev,
        categories: currentCategories.includes(category)
          ? currentCategories.filter((c) => c !== category)
          : [...currentCategories, category],
      };
    });
  };

  const addSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setProfile({ ...profile, skills: profile.skills.filter((s) => s !== skill) });
  };

  const addLanguage = () => {
    if (languageInput.trim() && !profile.languages.includes(languageInput.trim())) {
      setProfile({ ...profile, languages: [...profile.languages, languageInput.trim()] });
      setLanguageInput("");
    }
  };

  const removeLanguage = (lang) => {
    setProfile({ ...profile, languages: profile.languages.filter((l) => l !== lang) });
  };

  const addEducation = () => {
    if (educationForm.degree && educationForm.institution) {
      setProfile({ ...profile, education: [...profile.education, { ...educationForm }] });
      setEducationForm({ degree: "", institution: "", year: "" });
    }
  };

  const removeEducation = (index) => {
    setProfile({ ...profile, education: profile.education.filter((_, i) => i !== index) });
  };

  const addCertification = () => {
    if (certificationForm.name && certificationForm.issuer) {
      setProfile({ ...profile, certifications: [...profile.certifications, { ...certificationForm }] });
      setCertificationForm({ name: "", issuer: "", year: "" });
    }
  };

  const removeCertification = (index) => {
    setProfile({ ...profile, certifications: profile.certifications.filter((_, i) => i !== index) });
  };

  const addPortfolio = () => {
    if (portfolioForm.title && portfolioForm.description) {
      setProfile({ ...profile, portfolio: [...profile.portfolio, { ...portfolioForm }] });
      setPortfolioForm({ title: "", description: "", image_url: "", project_url: "" });
    }
  };

  const removePortfolio = (index) => {
    setProfile({ ...profile, portfolio: profile.portfolio.filter((_, i) => i !== index) });
  };

  if (fetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // VIEW MODE - See next artifact for this component
  if (viewMode && !isEditing) {
    return <ProfileViewMode 
      profile={profile} 
      user={user} 
      userId={userId}
      setIsEditing={setIsEditing}
    />;
  }

  // EDIT MODE
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <UserCircle className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {viewMode ? "Edit Your Profile" : "Complete Your Freelancer Profile"}
          </h1>
          <p className="text-muted-foreground text-lg">
            Stand out to potential clients with a professional profile
          </p>
        </div>

        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase size={24} className="text-purple-600" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-600">Basic Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title *</Label>
                  <Input
                    id="title"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    placeholder="e.g., Full Stack Developer"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio *</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell clients about your experience..."
                    required
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(profile.bio || "").length}/500 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={profile.experience_years}
                      onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="50"
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (USD) *</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={profile.hourly_rate}
                      onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })}
                      placeholder="50"
                      min="1"
                      step="0.01"
                      required
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="e.g., New York, USA"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <select
                      id="availability"
                      value={profile.availability}
                      onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                      className="w-full h-12 px-4 border border-input bg-background rounded-md"
                    >
                      <option value="available">Available for work</option>
                      <option value="busy">Currently busy</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolio_url">Portfolio URL</Label>
                    <Input
                      id="portfolio_url"
                      type="url"
                      value={profile.portfolio_url}
                      onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                      placeholder="https://yourportfolio.com"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-purple-600">Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((category) => {
                    const isSelected = Array.isArray(profile.categories) && profile.categories.includes(category);
                    return (
                      <Badge
                        key={category}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                          isSelected
                            ? "bg-purple-600 hover:bg-purple-700 shadow-md"
                            : "hover:bg-purple-50 dark:hover:bg-purple-950"
                        }`}
                        onClick={() => toggleCategory(category)}
                      >
                        {isSelected && <CheckCircle size={14} className="mr-1" />}
                        {category}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Skills - Predefined badges */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-purple-600">Skills * (Click to select)</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => {
                    const isSelected = Array.isArray(profile.skills) && profile.skills.includes(skill);
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
                        {isSelected && <CheckCircle size={14} className="mr-1" />}
                        {skill}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {Array.isArray(profile.skills) ? profile.skills.length : 0} skills
                </p>
              </div>

              {/* Custom Skills Input */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-purple-600">Add Custom Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Add a custom skill"
                    className="h-12"
                  />
                  <Button type="button" onClick={addSkill} className="h-12">
                    <Plus size={18} className="mr-2" />
                    Add
                  </Button>
                </div>
                {profile.skills.filter(s => !availableSkills.includes(s)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.filter(s => !availableSkills.includes(s)).map((skill, idx) => (
                      <Badge key={idx} className="bg-green-600 hover:bg-green-700">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="ml-2">
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Languages */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-purple-600">Languages</Label>
                <div className="flex gap-2">
                  <Input
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                    placeholder="e.g., English - Native"
                    className="h-12"
                  />
                  <Button type="button" onClick={addLanguage} className="h-12">
                    <Plus size={18} className="mr-2" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {profile.languages.map((lang, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <span>{lang}</span>
                      <button type="button" onClick={() => removeLanguage(lang)} className="text-red-600 hover:text-red-700">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-purple-600">Education</Label>
                <div className="space-y-3">
                  <Input
                    value={educationForm.degree}
                    onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                    placeholder="Degree (e.g., Bachelor of Science)"
                    className="h-12"
                  />
                  <Input
                    value={educationForm.institution}
                    onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                    placeholder="Institution"
                    className="h-12"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={educationForm.year}
                      onChange={(e) => setEducationForm({ ...educationForm, year: e.target.value })}
                      placeholder="Year"
                      className="flex-1 h-12"
                    />
                    <Button type="button" onClick={addEducation} className="h-12">
                      <Plus size={18} className="mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="flex items-start justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div>
                        <p className="font-semibold">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        {edu.year && <p className="text-xs text-muted-foreground">{edu.year}</p>}
                      </div>
                      <button type="button" onClick={() => removeEducation(idx)} className="text-red-600">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-purple-600">Certifications</Label>
                <div className="space-y-3">
                  <Input
                    value={certificationForm.name}
                    onChange={(e) => setCertificationForm({ ...certificationForm, name: e.target.value })}
                    placeholder="Certification Name"
                    className="h-12"
                  />
                  <Input
                    value={certificationForm.issuer}
                    onChange={(e) => setCertificationForm({ ...certificationForm, issuer: e.target.value })}
                    placeholder="Issuing Organization"
                    className="h-12"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={certificationForm.year}
                      onChange={(e) => setCertificationForm({ ...certificationForm, year: e.target.value })}
                      placeholder="Year"
                      className="flex-1 h-12"
                    />
                    <Button type="button" onClick={addCertification} className="h-12">
                      <Plus size={18} className="mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {profile.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-start justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div>
                        <p className="font-semibold">{cert.name}</p>
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                        {cert.year && <p className="text-xs text-muted-foreground">{cert.year}</p>}
                      </div>
                      <button type="button" onClick={() => removeCertification(idx)} className="text-red-600">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-purple-600">Portfolio Projects</Label>
                <div className="space-y-3">
                  <Input
                    value={portfolioForm.title}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                    placeholder="Project Title"
                    className="h-12"
                  />
                  <Textarea
                    value={portfolioForm.description}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                    placeholder="Project Description"
                    rows={3}
                  />
                  <Input
                    value={portfolioForm.image_url}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, image_url: e.target.value })}
                    placeholder="Image URL (optional)"
                    className="h-12"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={portfolioForm.project_url}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, project_url: e.target.value })}
                      placeholder="Project URL (optional)"
                      className="flex-1 h-12"
                    />
                    <Button type="button" onClick={addPortfolio} className="h-12">
                      <Plus size={18} className="mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.portfolio.map((item, idx) => (
                    <div key={idx} className="relative border rounded-lg overflow-hidden">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" />
                      )}
                      <div className="p-4">
                        <p className="font-semibold mb-1">{item.title}</p>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        {item.project_url && (
                          <a href={item.project_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 text-xs">
                            View Project
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePortfolio(idx)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (viewMode) {
                      setIsEditing(false);
                    } else {
                      navigate("/seller-dashboard");
                    }
                  }}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Save Profile
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
export default FreelancerProfileSetup;















// // frontend/src/pages/FreelancerProfileSetup.jsx - BULLETPROOF FIX
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../components/ui/card";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import { Label } from "../components/ui/label";
// import { Textarea } from "../components/ui/textarea";
// import { Badge } from "../components/ui/badge";
// import {
//   UserCircle,
//   Briefcase,
//   DollarSign,
//   Award,
//   Globe,
//   CheckCircle,
// } from "lucide-react";
// import api from "../utils/api";

// const FreelancerProfileSetup = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [fetchingProfile, setFetchingProfile] = useState(true);

//   // ✅ FIX: Always initialize with empty arrays
//   const [profile, setProfile] = useState({
//     title: "",
//     bio: "",
//     skills: [],
//     experience_years: 0,
//     hourly_rate: "",
//     portfolio_url: "",
//     certifications: [],
//     categories: [], // ✅ Always array
//   });

//   const availableSkills = [
//     "React",
//     "Node.js",
//     "Python",
//     "Django",
//     "FastAPI",
//     "PostgreSQL",
//     "MongoDB",
//     "AWS",
//     "Docker",
//     "Kubernetes",
//     "UI/UX Design",
//     "Figma",
//     "Adobe XD",
//     "Content Writing",
//     "SEO",
//     "Digital Marketing",
//     "Video Editing",
//     "Data Science",
//     "Machine Learning",
//     "TensorFlow",
//     "Vue.js",
//     "Angular",
//     "TypeScript",
//     "GraphQL",
//     "Redis",
//   ];

//   const availableCategories = [
//     "Web Development",
//     "Mobile Development",
//     "UI/UX Design",
//     "Data Science",
//     "Machine Learning",
//     "DevOps",
//     "Content Writing",
//     "Digital Marketing",
//     "Video Editing",
//     "Graphic Design",
//     "Consulting",
//   ];

//   useEffect(() => {
//     loadProfile();
//   }, []);

//   const loadProfile = async () => {
//     try {
//       setFetchingProfile(true);
//       const response = await api.get("/freelancer/profile");

//       if (response.data.profile) {
//         // ✅ FIX: Ensure all arrays have default values
//         setProfile({
//           title: response.data.profile.title || "",
//           bio: response.data.profile.bio || "",
//           skills: Array.isArray(response.data.profile.skills)
//             ? response.data.profile.skills
//             : [],
//           experience_years: response.data.profile.experience_years || 0,
//           hourly_rate: response.data.profile.hourly_rate || "",
//           portfolio_url: response.data.profile.portfolio_url || "",
//           certifications: Array.isArray(response.data.profile.certifications)
//             ? response.data.profile.certifications
//             : [],
//           categories: Array.isArray(response.data.profile.categories)
//             ? response.data.profile.categories
//             : [],
//         });
//       }
//     } catch (error) {
//       console.error("Error loading profile:", error);
//       if (error.response?.status !== 404) {
//         toast.error("Failed to load profile");
//       }
//     } finally {
//       setFetchingProfile(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validation
//     if (!profile.title?.trim()) {
//       toast.error("Professional title is required");
//       return;
//     }
//     if (!profile.bio?.trim()) {
//       toast.error("Bio is required");
//       return;
//     }
//     if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
//       toast.error("Please select at least one skill");
//       return;
//     }
//     if (!profile.hourly_rate || parseFloat(profile.hourly_rate) <= 0) {
//       toast.error("Please enter a valid hourly rate");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await api.post("/freelancer/profile", {
//         ...profile,
//         hourly_rate: parseFloat(profile.hourly_rate),
//         experience_years: parseInt(profile.experience_years) || 0,
//       });

//       toast.success(response.data.message || "Profile saved successfully!");
//       setTimeout(() => {
//         navigate("/seller-dashboard");
//       }, 1500);
//     } catch (error) {
//       console.error("Error saving profile:", error);
//       toast.error(error.response?.data?.detail || "Failed to save profile");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleSkill = (skill) => {
//     setProfile((prev) => {
//       // ✅ FIX: Defensive check
//       const currentSkills = Array.isArray(prev.skills) ? prev.skills : [];
//       return {
//         ...prev,
//         skills: currentSkills.includes(skill)
//           ? currentSkills.filter((s) => s !== skill)
//           : [...currentSkills, skill],
//       };
//     });
//   };

//   const toggleCategory = (category) => {
//     setProfile((prev) => {
//       // ✅ FIX: Defensive check
//       const currentCategories = Array.isArray(prev.categories)
//         ? prev.categories
//         : [];
//       return {
//         ...prev,
//         categories: currentCategories.includes(category)
//           ? currentCategories.filter((c) => c !== category)
//           : [...currentCategories, category],
//       };
//     });
//   };

//   if (fetchingProfile) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="flex flex-col items-center gap-4">
//           <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
//           <p className="text-sm text-muted-foreground">Loading profile...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-12">
//       <div className="max-w-4xl mx-auto px-4">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
//             <UserCircle className="text-white" size={40} />
//           </div>
//           <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
//             Complete Your Freelancer Profile
//           </h1>
//           <p className="text-muted-foreground text-lg">
//             Stand out to potential clients with a professional profile
//           </p>
//         </div>

//         <Card className="shadow-xl border-2">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Briefcase size={24} className="text-purple-600" />
//               Professional Information
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Professional Title */}
//               <div className="space-y-2">
//                 <Label htmlFor="title" className="text-base font-semibold">
//                   Professional Title *
//                 </Label>
//                 <Input
//                   id="title"
//                   value={profile.title}
//                   onChange={(e) =>
//                     setProfile({ ...profile, title: e.target.value })
//                   }
//                   placeholder="e.g., Full Stack Developer, UI/UX Designer"
//                   required
//                   className="h-12"
//                 />
//               </div>

//               {/* Bio */}
//               <div className="space-y-2">
//                 <Label htmlFor="bio" className="text-base font-semibold">
//                   Professional Bio *
//                 </Label>
//                 <Textarea
//                   id="bio"
//                   value={profile.bio}
//                   onChange={(e) =>
//                     setProfile({ ...profile, bio: e.target.value })
//                   }
//                   placeholder="Tell clients about your experience, expertise, and what makes you unique..."
//                   required
//                   rows={6}
//                   className="resize-none"
//                 />
//                 <p className="text-xs text-muted-foreground">
//                   {(profile.bio || "").length}/500 characters
//                 </p>
//               </div>

//               {/* Experience & Rate */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="experience"
//                     className="text-base font-semibold"
//                   >
//                     Years of Experience *
//                   </Label>
//                   <div className="relative">
//                     <Briefcase
//                       className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                       size={18}
//                     />
//                     <Input
//                       id="experience"
//                       type="number"
//                       value={profile.experience_years}
//                       onChange={(e) =>
//                         setProfile({
//                           ...profile,
//                           experience_years: parseInt(e.target.value) || 0,
//                         })
//                       }
//                       min="0"
//                       max="50"
//                       required
//                       className="pl-10 h-12"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="hourly_rate"
//                     className="text-base font-semibold"
//                   >
//                     Hourly Rate (USD) *
//                   </Label>
//                   <div className="relative">
//                     <DollarSign
//                       className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                       size={18}
//                     />
//                     <Input
//                       id="hourly_rate"
//                       type="number"
//                       value={profile.hourly_rate}
//                       onChange={(e) =>
//                         setProfile({
//                           ...profile,
//                           hourly_rate: e.target.value,
//                         })
//                       }
//                       placeholder="50"
//                       min="1"
//                       step="0.01"
//                       required
//                       className="pl-10 h-12"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Portfolio URL */}
//               <div className="space-y-2">
//                 <Label htmlFor="portfolio" className="text-base font-semibold">
//                   Portfolio URL (Optional)
//                 </Label>
//                 <div className="relative">
//                   <Globe
//                     className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                     size={18}
//                   />
//                   <Input
//                     id="portfolio"
//                     type="url"
//                     value={profile.portfolio_url}
//                     onChange={(e) =>
//                       setProfile({ ...profile, portfolio_url: e.target.value })
//                     }
//                     placeholder="https://yourportfolio.com"
//                     className="pl-10 h-12"
//                   />
//                 </div>
//               </div>

//               {/* Categories */}
//               <div className="space-y-3">
//                 <Label className="text-base font-semibold">
//                   Categories (Select your specialties)
//                 </Label>
//                 <div className="flex flex-wrap gap-2">
//                   {availableCategories.map((category) => {
//                     // ✅ FIX: Safe check
//                     const isSelected =
//                       Array.isArray(profile.categories) &&
//                       profile.categories.includes(category);

//                     return (
//                       <Badge
//                         key={category}
//                         variant={isSelected ? "default" : "outline"}
//                         className={`cursor-pointer px-4 py-2 text-sm transition-all ${
//                           isSelected
//                             ? "bg-purple-600 hover:bg-purple-700 shadow-md"
//                             : "hover:bg-purple-50 dark:hover:bg-purple-950"
//                         }`}
//                         onClick={() => toggleCategory(category)}
//                       >
//                         {isSelected && (
//                           <CheckCircle size={14} className="mr-1" />
//                         )}
//                         {category}
//                       </Badge>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Skills */}
//               <div className="space-y-3">
//                 <Label className="text-base font-semibold">
//                   Skills * (Select all that apply)
//                 </Label>
//                 <div className="flex flex-wrap gap-2">
//                   {availableSkills.map((skill) => {
//                     // ✅ FIX: Safe check
//                     const isSelected =
//                       Array.isArray(profile.skills) &&
//                       profile.skills.includes(skill);

//                     return (
//                       <Badge
//                         key={skill}
//                         variant={isSelected ? "default" : "outline"}
//                         className={`cursor-pointer px-4 py-2 text-sm transition-all ${
//                           isSelected
//                             ? "bg-blue-600 hover:bg-blue-700 shadow-md"
//                             : "hover:bg-blue-50 dark:hover:bg-blue-950"
//                         }`}
//                         onClick={() => toggleSkill(skill)}
//                       >
//                         {isSelected && (
//                           <CheckCircle size={14} className="mr-1" />
//                         )}
//                         {skill}
//                       </Badge>
//                     );
//                   })}
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   Selected:{" "}
//                   {Array.isArray(profile.skills) ? profile.skills.length : 0}{" "}
//                   skills
//                 </p>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3 pt-6">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => navigate("/seller-dashboard")}
//                   className="flex-1"
//                   disabled={loading}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
//                 >
//                   {loading ? (
//                     <>
//                       <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Award size={18} className="mr-2" />
//                       Save Profile
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </form>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default FreelancerProfileSetup;
