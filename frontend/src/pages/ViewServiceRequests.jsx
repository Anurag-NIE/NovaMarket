import React, { useState, useEffect } from "react";
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
import { Badge } from "../components/ui/badge";
import {
  Briefcase,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Eye,
  Send,
  Clock,
  ArrowLeft,
} from "lucide-react";
import api from "../utils/api";

const ViewServiceRequests = ({ user, filter = "all" }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [
    "All",
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
  ];

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let endpoint = "/service-requests";

      if (filter === "my-requests") {
        endpoint = "/my-service-requests";
      }

      const response = await api.get(endpoint);
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load service requests");
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !selectedCategory ||
      selectedCategory === "All" ||
      request.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() =>
            navigate(
              user?.role === "buyer" ? "/buyer-dashboard" : "/seller-dashboard"
            )
          }
          className="mb-6"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {filter === "my-requests"
              ? "My Service Requests"
              : "Browse Projects"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {filter === "my-requests"
              ? "Manage your posted projects and proposals"
              : "Find projects that match your skills"}
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6 shadow-lg border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-12 px-4 border border-input bg-background rounded-md min-w-[200px]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat === "All" ? "" : cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <Button onClick={fetchRequests} className="h-12">
                <Filter size={18} className="mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredRequests.length} of {requests.length} projects
        </div>

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <Card className="shadow-lg border-2">
            <CardContent className="py-12 text-center">
              <Briefcase
                size={64}
                className="mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === "my-requests"
                  ? "You haven't posted any projects yet"
                  : "No projects match your search criteria"}
              </p>
              {filter === "my-requests" && (
                <Button onClick={() => navigate("/post-service-request")}>
                  Post Your First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map((request) => (
              <Card
                key={request._id}
                className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 line-clamp-2">
                        {request.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">{request.category}</Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {request.description}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {request.skills_required?.slice(0, 5).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {request.skills_required?.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{request.skills_required.length - 5} more
                      </Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="font-semibold">
                        ${request.budget?.toLocaleString()}
                      </span>
                    </div>
                    {request.deadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={16} />
                        <span>Deadline: {formatDate(request.deadline)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Send size={16} />
                      <span>{request.proposals_count || 0} Proposals</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={16} />
                      <span>Posted {formatDate(request.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        navigate(`/service-request/${request._id}`)
                      }
                    >
                      <Eye size={16} className="mr-2" />
                      View Details
                    </Button>

                    {user?.role === "seller" && request.status === "open" && (
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                        onClick={() =>
                          navigate(`/submit-proposal/${request._id}`)
                        }
                      >
                        <Send size={16} className="mr-2" />
                        Submit Proposal
                      </Button>
                    )}

                    {user?.role === "buyer" && filter === "my-requests" && (
                      <Button
                        className="flex-1"
                        onClick={() =>
                          navigate(`/manage-proposals/${request._id}`)
                        }
                      >
                        <Eye size={16} className="mr-2" />
                        Proposals ({request.proposals_count || 0})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewServiceRequests;
