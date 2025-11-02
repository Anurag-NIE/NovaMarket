import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
  Calendar,
  Briefcase,
  TrendingUp,
} from "lucide-react";

const ServiceMarketplace = () => {
  const [view, setView] = useState("browse");
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    deadline: "",
    skills_required: [],
    experience_level: "intermediate",
  });

  const API_URL = "http://localhost:8000/api";
  const getToken = () => localStorage.getItem("token");
  const getUser = () => JSON.parse(localStorage.getItem("user") || "{}");

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
    "Other",
  ];

  const skills = [
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
  ];

  useEffect(() => {
    loadRequests();
  }, [selectedCategory, view]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(`${API_URL}/service-requests?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();

      if (view === "myRequests") {
        setMyRequests(data.requests || []);
      } else {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/service-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to post request");

      alert("Service request posted successfully!");
      setView("myRequests");
      setFormData({
        title: "",
        description: "",
        category: "",
        budget: "",
        deadline: "",
        skills_required: [],
        experience_level: "intermediate",
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (requestId) => {
    const coverLetter = prompt("Enter your cover letter:");
    if (!coverLetter) return;

    const proposedPrice = prompt("Enter your proposed price (USD):");
    if (!proposedPrice) return;

    const deliveryDays = prompt("Delivery time in days:");
    if (!deliveryDays) return;

    try {
      const response = await fetch(
        `${API_URL}/service-requests/${requestId}/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            cover_letter: coverLetter,
            proposed_price: parseFloat(proposedPrice),
            delivery_time_days: parseInt(deliveryDays),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to submit proposal");
      alert("Proposal submitted successfully!");
      loadRequests();
    } catch (error) {
      alert(error.message);
    }
  };

  const user = getUser();
  const isBuyer = user.role === "buyer";

  const filteredRequests = requests.filter(
    (req) =>
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Service Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {isBuyer
              ? "Post your project and hire the best talent"
              : "Find work that matches your skills"}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-md">
            <button
              onClick={() => setView("browse")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                view === "browse"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Search className="inline w-5 h-5 mr-2" />
              Browse Requests
            </button>

            {isBuyer && (
              <button
                onClick={() => setView("post")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  view === "post"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Briefcase className="inline w-5 h-5 mr-2" />
                Post Request
              </button>
            )}

            {isBuyer && (
              <button
                onClick={() => setView("myRequests")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  view === "myRequests"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                My Requests
              </button>
            )}
          </div>
        </div>

        {/* Browse View */}
        {view === "browse" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                    !selectedCategory
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests List */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading projects...
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <Briefcase size={64} className="mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                  No projects found
                </p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-l-4 border-purple-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {request.title}
                          </h3>
                          {request.ai_match_score &&
                            request.ai_match_score >= 70 && (
                              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-bold flex items-center gap-1">
                                <Star size={14} fill="currentColor" />
                                {request.ai_match_score}% Match
                              </span>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                          {request.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                            {request.category}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              request.experience_level === "beginner"
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : request.experience_level === "intermediate"
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                : "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                            }`}
                          >
                            {request.experience_level}
                          </span>
                        </div>

                        {request.skills_required &&
                          request.skills_required.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {request.skills_required.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                        <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <DollarSign size={18} />
                            <span className="font-bold text-green-600 dark:text-green-400">
                              ${request.budget}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={18} />
                            <span>
                              {new Date(request.deadline).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase size={18} />
                            <span>{request.proposal_count || 0} proposals</span>
                          </div>
                        </div>
                      </div>

                      {!isBuyer && (
                        <button
                          onClick={() => handleApply(request.id)}
                          className="ml-6 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                        >
                          Submit Proposal
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Request View */}
        {view === "post" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                Post a Service Request
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Need a React developer for e-commerce website"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your project requirements in detail..."
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Experience Level *
                    </label>
                    <select
                      value={formData.experience_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          experience_level: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Budget (USD) *
                    </label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      placeholder="1000"
                      required
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Deadline *
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, deadline: e.target.value })
                      }
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Required Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          const newSkills = formData.skills_required.includes(
                            skill
                          )
                            ? formData.skills_required.filter(
                                (s) => s !== skill
                              )
                            : [...formData.skills_required, skill];
                          setFormData({
                            ...formData,
                            skills_required: newSkills,
                          });
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.skills_required.includes(skill)
                            ? "bg-purple-600 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setView("browse")}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {loading ? "Posting..." : "Post Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceMarketplace;
