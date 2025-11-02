// frontend/src/pages/SubmitProposal.jsx - COMPLETE FIXED VERSION
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
  Send,
  DollarSign,
  Clock,
  FileText,
  Briefcase,
  AlertCircle,
  ArrowLeft,
  Plus,
  X,
  CheckCircle,
  Target,
  Zap,
  Award,
  TrendingUp,
  MessageSquare,
  Calendar,
} from "lucide-react";
import api from "../utils/api";

const SubmitProposal = ({ user }) => {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [request, setRequest] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    cover_letter: "",
    proposed_budget: "",
    delivery_time: "",
    milestones: [],
  });

  const [milestone, setMilestone] = useState({
    title: "",
    description: "",
    amount: "",
    duration: "",
  });

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      const response = await api.get(`/service-requests/${requestId}`);
      setRequest(response.data);
      setFormData((prev) => ({
        ...prev,
        proposed_budget: response.data.budget?.toString() || "",
      }));
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load service request");
      navigate("/browse-requests");
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleAddMilestone = () => {
    if (!milestone.title.trim() || !milestone.amount || !milestone.duration) {
      toast.error("Please fill all milestone fields");
      return;
    }

    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          ...milestone,
          amount: parseFloat(milestone.amount),
          duration: parseInt(milestone.duration),
        },
      ],
    });

    setMilestone({ title: "", description: "", amount: "", duration: "" });
    toast.success("Milestone added successfully!");
  };

  const handleRemoveMilestone = (index) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index),
    });
    toast.success("Milestone removed");
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.cover_letter.trim()) {
          toast.error("Please write a proposal message");
          return false;
        }
        if (formData.cover_letter.length < 100) {
          toast.error("Proposal message should be at least 100 characters");
          return false;
        }
        return true;
      case 2:
        if (
          !formData.proposed_budget ||
          parseFloat(formData.proposed_budget) <= 0
        ) {
          toast.error("Please enter a valid budget");
          return false;
        }
        if (!formData.delivery_time || parseInt(formData.delivery_time) <= 0) {
          toast.error("Please enter a valid delivery time");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setLoading(true);

    try {
      console.log("Submitting proposal:", {
        request_id: requestId,
        cover_letter: formData.cover_letter,
        proposed_budget: parseFloat(formData.proposed_budget),
        delivery_time: parseInt(formData.delivery_time),
        milestones: formData.milestones,
      });

      const response = await api.post("/proposals", {
        request_id: requestId,
        cover_letter: formData.cover_letter,
        proposed_budget: parseFloat(formData.proposed_budget),
        delivery_time: parseInt(formData.delivery_time),
        milestones: formData.milestones,
      });

      console.log("Proposal response:", response);

      toast.success("🎉 Proposal submitted successfully!");
      setTimeout(() => {
        navigate("/browse-requests");
      }, 2000);
    } catch (error) {
      console.error("Error submitting proposal:", error);
      console.error("Error details:", error.response?.data);

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to submit proposal. Please check console for details.";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-purple-500 mx-auto mb-6"></div>
            <Zap
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400"
              size={32}
            />
          </div>
          <p className="text-lg text-purple-200 animate-pulse">
            Loading project details...
          </p>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const totalMilestoneAmount = formData.milestones.reduce(
    (sum, m) => sum + m.amount,
    0
  );

  const steps = [
    { num: 1, title: "Introduction", icon: MessageSquare },
    { num: 2, title: "Pricing & Time", icon: DollarSign },
    { num: 3, title: "Milestones", icon: Target },
    { num: 4, title: "Review", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/browse-requests")}
          className="mb-6 text-purple-200 hover:text-white hover:bg-purple-800/50"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Projects
        </Button>

        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <Send className="text-white" size={48} />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Submit Your Winning Proposal
            </h1>
            <p className="text-purple-200 text-lg max-w-2xl mx-auto">
              Stand out from the competition with a compelling proposal
            </p>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;

              return (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-purple-500 to-pink-500 scale-110 shadow-lg shadow-purple-500/50"
                          : isCompleted
                          ? "bg-green-500 shadow-lg shadow-green-500/50"
                          : "bg-slate-700 border-2 border-slate-600"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="text-white" size={24} />
                      ) : (
                        <Icon
                          className={isActive ? "text-white" : "text-slate-400"}
                          size={24}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive
                          ? "text-purple-300"
                          : isCompleted
                          ? "text-green-400"
                          : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="flex-1 h-1 mx-4 relative">
                      <div className="absolute inset-0 bg-slate-700 rounded"></div>
                      <div
                        className={`absolute inset-0 rounded transition-all duration-500 ${
                          isCompleted
                            ? "bg-gradient-to-r from-green-500 to-purple-500"
                            : "bg-transparent"
                        }`}
                        style={{ width: isCompleted ? "100%" : "0%" }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="sticky top-6 bg-slate-800/50 backdrop-blur-xl border-2 border-purple-500/20 shadow-2xl">
              <CardHeader className="border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-3 text-purple-200">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Briefcase size={24} className="text-purple-400" />
                  </div>
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-3 text-white">
                    {request.title}
                  </h3>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {request.category}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <DollarSign size={20} className="text-green-400" />
                    <div>
                      <p className="text-xs text-slate-400">Client Budget</p>
                      <p className="font-bold text-lg text-green-400">
                        ${request.budget?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {request.deadline && (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <Calendar size={20} className="text-blue-400" />
                      <div>
                        <p className="text-xs text-slate-400">Deadline</p>
                        <p className="font-semibold text-blue-400">
                          {new Date(request.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <TrendingUp size={20} className="text-purple-400" />
                    <div>
                      <p className="text-xs text-slate-400">Competition</p>
                      <p className="font-semibold text-purple-400">
                        {request.proposals_count || 0} proposals
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2 text-purple-300">
                    Description:
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">
                    {request.description}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3 text-purple-300">
                    Required Skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {request.skills_required?.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs bg-slate-700/50 text-slate-200 border-slate-600"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-2 border-purple-500/20 shadow-2xl">
              <CardContent className="pt-8">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-purple-500/20 rounded-xl">
                        <MessageSquare className="text-purple-400" size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Write Your Proposal
                        </h2>
                        <p className="text-slate-400">
                          Tell the client why they should hire you
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="cover_letter"
                        className="text-base font-semibold text-purple-300"
                      >
                        Your Proposal Message *
                      </Label>
                      <p className="text-sm text-slate-400 mb-2">
                        Explain why you're the best person for this project
                      </p>
                      <Textarea
                        id="cover_letter"
                        value={formData.cover_letter}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cover_letter: e.target.value,
                          })
                        }
                        placeholder="Hi! I'm interested in your project.

I have 5+ years experience with React, Node.js, and MongoDB. I recently built a similar platform for XYZ company.

My approach:
Week 1: Backend setup
Week 2: Frontend development  
Week 3: Testing & deployment

I'm confident I can deliver quality work on time!"
                        rows={12}
                        className="resize-none bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-purple-500"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                          {formData.cover_letter.length}/2000 characters
                          (minimum 100)
                        </p>
                        {formData.cover_letter.length >= 100 ? (
                          <p className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle size={14} /> Great!
                          </p>
                        ) : (
                          <p className="text-xs text-amber-400">
                            {100 - formData.cover_letter.length} more needed
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Award
                          className="text-blue-400 flex-shrink-0"
                          size={24}
                        />
                        <div>
                          <p className="font-semibold text-blue-300 mb-2">
                            What to Include:
                          </p>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>• Brief introduction about yourself</li>
                            <li>• Your relevant skills and experience</li>
                            <li>• How you'll complete the project</li>
                            <li>• Similar projects you've done</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <DollarSign className="text-green-400" size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Set Your Terms
                        </h2>
                        <p className="text-slate-400">
                          Define budget and timeline
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold text-purple-300">
                          Your Bid (USD) *
                        </Label>
                        <div className="relative">
                          <DollarSign
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400"
                            size={20}
                          />
                          <Input
                            type="number"
                            value={formData.proposed_budget}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                proposed_budget: e.target.value,
                              })
                            }
                            placeholder="1000"
                            min="1"
                            step="0.01"
                            className="pl-12 h-14 text-lg bg-slate-900/50 border-slate-700 text-white"
                          />
                        </div>
                        <p className="text-xs text-slate-400">
                          Client budget: ${request.budget?.toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold text-purple-300">
                          Delivery Time (Days) *
                        </Label>
                        <div className="relative">
                          <Clock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"
                            size={20}
                          />
                          <Input
                            type="number"
                            value={formData.delivery_time}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                delivery_time: e.target.value,
                              })
                            }
                            placeholder="14"
                            min="1"
                            className="pl-12 h-14 text-lg bg-slate-900/50 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Target className="text-purple-400" size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Add Milestones
                        </h2>
                        <p className="text-slate-400">
                          Optional but recommended
                        </p>
                      </div>
                    </div>

                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="pt-6 space-y-4">
                        <Input
                          placeholder="Milestone title"
                          value={milestone.title}
                          onChange={(e) =>
                            setMilestone({
                              ...milestone,
                              title: e.target.value,
                            })
                          }
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            type="number"
                            placeholder="Amount ($)"
                            value={milestone.amount}
                            onChange={(e) =>
                              setMilestone({
                                ...milestone,
                                amount: e.target.value,
                              })
                            }
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                          <Input
                            type="number"
                            placeholder="Days"
                            value={milestone.duration}
                            onChange={(e) =>
                              setMilestone({
                                ...milestone,
                                duration: e.target.value,
                              })
                            }
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddMilestone}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus size={18} className="mr-2" />
                          Add Milestone
                        </Button>
                      </CardContent>
                    </Card>

                    {formData.milestones.length > 0 && (
                      <div className="space-y-3">
                        {formData.milestones.map((m, idx) => (
                          <Card
                            key={idx}
                            className="bg-purple-900/20 border-purple-500/20"
                          >
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-white mb-2">
                                    {m.title}
                                  </h4>
                                  <div className="flex gap-4 text-sm">
                                    <span className="text-green-400">
                                      ${m.amount}
                                    </span>
                                    <span className="text-blue-400">
                                      {m.duration} days
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMilestone(idx)}
                                  className="text-red-400"
                                >
                                  <X size={18} />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <CheckCircle className="text-green-400" size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Final Review
                        </h2>
                        <p className="text-slate-400">
                          Check everything before submitting
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-purple-300">
                            Your Proposal
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-300 whitespace-pre-wrap">
                            {formData.cover_letter}
                          </p>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-green-500/10 border-green-500/20">
                          <CardContent className="pt-6">
                            <DollarSign
                              className="text-green-400 mb-2"
                              size={32}
                            />
                            <p className="text-sm text-slate-400">Your Bid</p>
                            <p className="text-3xl font-bold text-green-400">
                              $
                              {parseFloat(
                                formData.proposed_budget
                              ).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-blue-500/10 border-blue-500/20">
                          <CardContent className="pt-6">
                            <Clock className="text-blue-400 mb-2" size={32} />
                            <p className="text-sm text-slate-400">Delivery</p>
                            <p className="text-3xl font-bold text-blue-400">
                              {formData.delivery_time} days
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-8 border-t border-slate-700 mt-8">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1 h-12 border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <ArrowLeft size={18} className="mr-2" />
                      Previous
                    </Button>
                  )}

                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className={`${
                        currentStep === 1 ? "w-full" : "flex-1"
                      } h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700`}
                    >
                      Continue
                      <ArrowLeft size={18} className="ml-2 rotate-180" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} className="mr-2" />
                          Submit Proposal
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitProposal;
