// frontend/src/pages/ServiceMarketplacePage.jsx - FIXED
import React from "react";
import ServiceMarketplace from "./ServiceMarketplace"; // ✅ FIXED: Changed from components to pages

const ServiceMarketplacePage = () => {
  return (
    <div className="min-h-screen">
      <ServiceMarketplace />
    </div>
  );
};

export default ServiceMarketplacePage;
















// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Search,
//   Filter,
//   Briefcase,
//   Clock,
//   DollarSign,
//   MapPin,
//   Star,
//   Send,
//   Plus,
//   Eye,
//   Edit,
//   Trash2,
//   CheckCircle,
//   XCircle,
//   TrendingUp,
//   Users,
//   Award,
// } from "lucide-react";
// import { toast } from "sonner";

// const ServiceMarketplacePage = ({ user }) => {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState("browse"); // browse, my-requests, post-request, proposals
//   const [requests, setRequests] = useState([]);
//   const [myRequests, setMyRequests] = useState([]);
//   const [myProposals, setMyProposals] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [filters, setFilters] = useState({
//     category: "",
//     search: "",
//     budget_min: "",
//     budget_max: "",
//     status: "",
//   });

//   // Post Request Form
//   const [requestForm, setRequestForm] = useState({
//     title: "",
//     description: "",
//     category: "",
//     budget: "",
//     deadline: "",
//     skills_required: "",
//   });

//   const categories = [
//     "Web Development",
//     "Mobile Development",
//     "UI/UX Design",
//     "Graphic Design",
//     "Content Writing",
//     "Digital Marketing",
//     "Video Editing",
//     "Data Entry",
//     "Virtual Assistant",
//     "SEO Services",
//     "Social Media Management",
//     "Translation",
//   ];

//   const API_URL = "http://localhost:8000/api";
//   const getToken = () => localStorage.getItem("token");

//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//       return;
//     }
//     loadData();
//   }, [activeTab, filters]);

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       if (activeTab === "browse") {
//         await loadAllRequests();
//       } else if (activeTab === "my-requests") {
//         await loadMyRequests();
//       } else if (activeTab === "proposals") {
//         await loadMyProposals();
//       }
//     } catch (error) {
//       console.error("Error loading data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadAllRequests = async () => {
//     try {
//       const params = new URLSearchParams();
//       if (filters.category) params.append("category", filters.category);
//       if (filters.search) params.append("search", filters.search);
//       if (filters.budget_min) params.append("budget_min", filters.budget_min);
//       if (filters.budget_max) params.append("budget_max", filters.budget_max);
//       if (filters.status) params.append("status", filters.status);

//       const response = await fetch(
//         `${API_URL}/service-requests?${params.toString()}`,
//         {
//           headers: { Authorization: `Bearer ${getToken()}` },
//         }
//       );

//       if (response.ok) {
//         const data = await response.json();
//         setRequests(data.service_requests || data || []);
//       }
//     } catch (error) {
//       console.error("Error loading requests:", error);
//       toast.error("Failed to load service requests");
//     }
//   };

//   const loadMyRequests = async () => {
//     try {
//       const response = await fetch(`${API_URL}/service-requests/my-requests`, {
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setMyRequests(data.service_requests || data.requests || []);
//       }
//     } catch (error) {
//       console.error("Error loading my requests:", error);
//       toast.error("Failed to load your requests");
//     }
//   };

//   const loadMyProposals = async () => {
//     try {
//       const response = await fetch(`${API_URL}/proposals/my-proposals`, {
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setMyProposals(data.proposals || []);
//       }
//     } catch (error) {
//       console.error("Error loading proposals:", error);
//       toast.error("Failed to load your proposals");
//     }
//   };

//   const handlePostRequest = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const response = await fetch(`${API_URL}/service-requests`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${getToken()}`,
//         },
//         body: JSON.stringify({
//           ...requestForm,
//           budget: parseFloat(requestForm.budget),
//           skills_required: requestForm.skills_required
//             .split(",")
//             .map((s) => s.trim())
//             .filter(Boolean),
//         }),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.detail || "Failed to post request");
//       }

//       toast.success("Service request posted successfully!");
//       setRequestForm({
//         title: "",
//         description: "",
//         category: "",
//         budget: "",
//         deadline: "",
//         skills_required: "",
//       });
//       setActiveTab("my-requests");
//       loadMyRequests();
//     } catch (error) {
//       toast.error(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmitProposal = async (requestId) => {
//     const proposal = prompt(
//       "Enter your proposal (describe how you'll help and your rate):"
//     );
//     if (!proposal) return;

//     const bid_amount = prompt("Enter your bid amount (USD):");
//     if (!bid_amount) return;

//     const delivery_time = prompt("Delivery time (in days):");
//     if (!delivery_time) return;

//     try {
//       const response = await fetch(`${API_URL}/proposals`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${getToken()}`,
//         },
//         body: JSON.stringify({
//           service_request_id: requestId,
//           proposal_text: proposal,
//           bid_amount: parseFloat(bid_amount),
//           delivery_time_days: parseInt(delivery_time),
//         }),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.detail || "Failed to submit proposal");
//       }

//       toast.success("Proposal submitted successfully!");
//       loadAllRequests();
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   const handleDeleteRequest = async (requestId) => {
//     if (!confirm("Are you sure you want to delete this request?")) return;

//     try {
//       const response = await fetch(`${API_URL}/service-requests/${requestId}`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });

//       if (response.ok) {
//         toast.success("Request deleted successfully");
//         loadMyRequests();
//       }
//     } catch (error) {
//       toast.error("Failed to delete request");
//     }
//   };

//   const handleAcceptProposal = async (proposalId) => {
//     if (!confirm("Accept this proposal? This will create a project.")) return;

//     try {
//       const response = await fetch(
//         `${API_URL}/proposals/${proposalId}/accept`,
//         {
//           method: "POST",
//           headers: { Authorization: `Bearer ${getToken()}` },
//         }
//       );

//       if (response.ok) {
//         toast.success("Proposal accepted! Project created.");
//         loadMyRequests();
//       }
//     } catch (error) {
//       toast.error("Failed to accept proposal");
//     }
//   };

//   // Render Browse Requests Tab
//   const renderBrowseTab = () => (
//     <div className="space-y-6">
//       {/* Filters */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
//         <div className="flex items-center gap-2 mb-4">
//           <Filter className="text-purple-600" size={20} />
//           <h3 className="font-bold text-lg">Filters</h3>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div>
//             <label className="block text-sm font-medium mb-2">Search</label>
//             <div className="relative">
//               <Search
//                 className="absolute left-3 top-3 text-gray-400"
//                 size={18}
//               />
//               <input
//                 type="text"
//                 placeholder="Search requests..."
//                 value={filters.search}
//                 onChange={(e) =>
//                   setFilters({ ...filters, search: e.target.value })
//                 }
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">Category</label>
//             <select
//               value={filters.category}
//               onChange={(e) =>
//                 setFilters({ ...filters, category: e.target.value })
//               }
//               className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//             >
//               <option value="">All Categories</option>
//               {categories.map((cat) => (
//                 <option key={cat} value={cat}>
//                   {cat}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">Min Budget</label>
//             <input
//               type="number"
//               placeholder="$0"
//               value={filters.budget_min}
//               onChange={(e) =>
//                 setFilters({ ...filters, budget_min: e.target.value })
//               }
//               className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">Max Budget</label>
//             <input
//               type="number"
//               placeholder="$10000"
//               value={filters.budget_max}
//               onChange={(e) =>
//                 setFilters({ ...filters, budget_max: e.target.value })
//               }
//               className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//             />
//           </div>
//         </div>

//         <button
//           onClick={() =>
//             setFilters({
//               category: "",
//               search: "",
//               budget_min: "",
//               budget_max: "",
//               status: "",
//             })
//           }
//           className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
//         >
//           Clear Filters
//         </button>
//       </div>

//       {/* Requests List */}
//       {loading ? (
//         <div className="text-center py-20">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading requests...</p>
//         </div>
//       ) : requests.length === 0 ? (
//         <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl">
//           <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
//           <h3 className="text-xl font-semibold mb-2">No Requests Found</h3>
//           <p className="text-gray-600">Try adjusting your filters</p>
//         </div>
//       ) : (
//         <div className="grid gap-6">
//           {requests.map((request) => (
//             <div
//               key={request.id || request._id}
//               className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
//             >
//               <div className="flex justify-between items-start mb-4">
//                 <div className="flex-1">
//                   <h3 className="text-xl font-bold mb-2">{request.title}</h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-3">
//                     {request.description}
//                   </p>

//                   <div className="flex flex-wrap gap-3 mb-4">
//                     <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
//                       {request.category}
//                     </span>
//                     <span className="flex items-center gap-1 text-sm text-gray-600">
//                       <DollarSign size={16} />
//                       Budget: ${request.budget}
//                     </span>
//                     <span className="flex items-center gap-1 text-sm text-gray-600">
//                       <Clock size={16} />
//                       Deadline:{" "}
//                       {new Date(request.deadline).toLocaleDateString()}
//                     </span>
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm ${
//                         request.status === "open"
//                           ? "bg-green-100 text-green-700"
//                           : request.status === "in_progress"
//                           ? "bg-blue-100 text-blue-700"
//                           : "bg-gray-100 text-gray-700"
//                       }`}
//                     >
//                       {request.status}
//                     </span>
//                   </div>

//                   {request.skills_required &&
//                     request.skills_required.length > 0 && (
//                       <div className="flex flex-wrap gap-2 mb-3">
//                         {request.skills_required.map((skill, idx) => (
//                           <span
//                             key={idx}
//                             className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
//                           >
//                             {skill}
//                           </span>
//                         ))}
//                       </div>
//                     )}

//                   <div className="flex items-center gap-2 text-sm text-gray-500">
//                     <Users size={16} />
//                     Posted by {request.client_name || "Client"}
//                     {request.proposals_count > 0 && (
//                       <>
//                         <span className="mx-2">•</span>
//                         <Award size={16} />
//                         {request.proposals_count} proposals
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {user?.role === "seller" && request.status === "open" && (
//                 <button
//                   onClick={() =>
//                     handleSubmitProposal(request.id || request._id)
//                   }
//                   className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
//                 >
//                   <Send size={18} />
//                   Submit Proposal
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   // Render My Requests Tab
//   const renderMyRequestsTab = () => (
//     <div className="space-y-6">
//       {loading ? (
//         <div className="text-center py-20">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
//         </div>
//       ) : myRequests.length === 0 ? (
//         <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl">
//           <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
//           <h3 className="text-xl font-semibold mb-2">No Requests Yet</h3>
//           <p className="text-gray-600 mb-4">Post your first service request</p>
//           <button
//             onClick={() => setActiveTab("post-request")}
//             className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
//           >
//             Post a Request
//           </button>
//         </div>
//       ) : (
//         <div className="grid gap-6">
//           {myRequests.map((request) => (
//             <div
//               key={request.id || request._id}
//               className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
//             >
//               <div className="flex justify-between items-start mb-4">
//                 <div className="flex-1">
//                   <h3 className="text-xl font-bold mb-2">{request.title}</h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-3">
//                     {request.description}
//                   </p>

//                   <div className="flex flex-wrap gap-3 mb-4">
//                     <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
//                       {request.category}
//                     </span>
//                     <span className="flex items-center gap-1 text-sm">
//                       <DollarSign size={16} />${request.budget}
//                     </span>
//                     <span className="flex items-center gap-1 text-sm">
//                       <Clock size={16} />
//                       {new Date(request.deadline).toLocaleDateString()}
//                     </span>
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm ${
//                         request.status === "open"
//                           ? "bg-green-100 text-green-700"
//                           : request.status === "in_progress"
//                           ? "bg-blue-100 text-blue-700"
//                           : "bg-gray-100 text-gray-700"
//                       }`}
//                     >
//                       {request.status}
//                     </span>
//                   </div>

//                   {request.proposals && request.proposals.length > 0 && (
//                     <div className="mt-4 border-t pt-4">
//                       <h4 className="font-semibold mb-3">
//                         Proposals ({request.proposals.length})
//                       </h4>
//                       <div className="space-y-3">
//                         {request.proposals.map((proposal) => (
//                           <div
//                             key={proposal.id}
//                             className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
//                           >
//                             <div className="flex justify-between items-start">
//                               <div className="flex-1">
//                                 <p className="font-medium mb-1">
//                                   {proposal.freelancer_name}
//                                 </p>
//                                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
//                                   {proposal.proposal_text}
//                                 </p>
//                                 <div className="flex gap-4 text-sm">
//                                   <span className="flex items-center gap-1">
//                                     <DollarSign size={14} />
//                                     Bid: ${proposal.bid_amount}
//                                   </span>
//                                   <span className="flex items-center gap-1">
//                                     <Clock size={14} />
//                                     {proposal.delivery_time_days} days
//                                   </span>
//                                 </div>
//                               </div>
//                               {proposal.status === "pending" && (
//                                 <button
//                                   onClick={() =>
//                                     handleAcceptProposal(proposal.id)
//                                   }
//                                   className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
//                                 >
//                                   <CheckCircle size={16} />
//                                   Accept
//                                 </button>
//                               )}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex gap-2">
//                   <button
//                     onClick={() =>
//                       handleDeleteRequest(request.id || request._id)
//                     }
//                     className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
//                   >
//                     <Trash2 size={18} />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   // Render Post Request Tab
//   const renderPostRequestTab = () => (
//     <div className="max-w-3xl mx-auto">
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
//         <h2 className="text-2xl font-bold mb-6">Post a Service Request</h2>

//         <form onSubmit={handlePostRequest} className="space-y-6">
//           <div>
//             <label className="block text-sm font-medium mb-2">
//               Request Title *
//             </label>
//             <input
//               type="text"
//               required
//               value={requestForm.title}
//               onChange={(e) =>
//                 setRequestForm({ ...requestForm, title: e.target.value })
//               }
//               placeholder="e.g., Need a professional website for my business"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">
//               Description *
//             </label>
//             <textarea
//               required
//               value={requestForm.description}
//               onChange={(e) =>
//                 setRequestForm({ ...requestForm, description: e.target.value })
//               }
//               placeholder="Describe what you need in detail..."
//               rows="6"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium mb-2">
//                 Category *
//               </label>
//               <select
//                 required
//                 value={requestForm.category}
//                 onChange={(e) =>
//                   setRequestForm({ ...requestForm, category: e.target.value })
//                 }
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//               >
//                 <option value="">Select category</option>
//                 {categories.map((cat) => (
//                   <option key={cat} value={cat}>
//                     {cat}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">
//                 Budget (USD) *
//               </label>
//               <input
//                 type="number"
//                 required
//                 min="10"
//                 value={requestForm.budget}
//                 onChange={(e) =>
//                   setRequestForm({ ...requestForm, budget: e.target.value })
//                 }
//                 placeholder="500"
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">Deadline *</label>
//             <input
//               type="date"
//               required
//               min={new Date().toISOString().split("T")[0]}
//               value={requestForm.deadline}
//               onChange={(e) =>
//                 setRequestForm({ ...requestForm, deadline: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">
//               Skills Required (comma-separated)
//             </label>
//             <input
//               type="text"
//               value={requestForm.skills_required}
//               onChange={(e) =>
//                 setRequestForm({
//                   ...requestForm,
//                   skills_required: e.target.value,
//                 })
//               }
//               placeholder="React, Node.js, MongoDB"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
//             />
//             <p className="text-sm text-gray-500 mt-1">
//               Separate skills with commas
//             </p>
//           </div>

//           <div className="flex gap-4">
//             <button
//               type="button"
//               onClick={() => setActiveTab("browse")}
//               className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
//                   Posting...
//                 </>
//               ) : (
//                 <>
//                   <Plus size={18} />
//                   Post Request
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );

//   // Render My Proposals Tab
//   const renderProposalsTab = () => (
//     <div className="space-y-6">
//       {loading ? (
//         <div className="text-center py-20">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
//         </div>
//       ) : myProposals.length === 0 ? (
//         <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl">
//           <Send className="mx-auto text-gray-400 mb-4" size={48} />
//           <h3 className="text-xl font-semibold mb-2">No Proposals Yet</h3>
//           <p className="text-gray-600 mb-4">
//             Browse requests and submit proposals
//           </p>
//           <button
//             onClick={() => setActiveTab("browse")}
//             className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
//           >
//             Browse Requests
//           </button>
//         </div>
//       ) : (
//         <div className="grid gap-6">
//           {myProposals.map((proposal) => (
//             <div
//               key={proposal.id}
//               className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
//             >
//               <div className="flex justify-between items-start mb-4">
//                 <div className="flex-1">
//                   <h3 className="text-xl font-bold mb-2">
//                     {proposal.request_title || "Service Request"}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-3">
//                     {proposal.proposal_text}
//                   </p>

//                   <div className="flex flex-wrap gap-3 mb-3">
//                     <span className="flex items-center gap-1 text-sm">
//                       <DollarSign size={16} />
//                       Bid: ${proposal.bid_amount}
//                     </span>
//                     <span className="flex items-center gap-1 text-sm">
//                       <Clock size={16} />
//                       Delivery: {proposal.delivery_time_days} days
//                     </span>
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm ${
//                         proposal.status === "accepted"
//                           ? "bg-green-100 text-green-700"
//                           : proposal.status === "rejected"
//                           ? "bg-red-100 text-red-700"
//                           : "bg-yellow-100 text-yellow-700"
//                       }`}
//                     >
//                       {proposal.status}
//                     </span>
//                   </div>

//                   <p className="text-sm text-gray-500">
//                     Submitted on{" "}
//                     {new Date(proposal.created_at).toLocaleDateString()}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
//             Service Marketplace
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 text-lg">
//             {user?.role === "buyer"
//               ? "Post requests and hire freelancers"
//               : "Find work and submit proposals"}
//           </p>
//         </div>

//         {/* Tabs */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
//           <div className="flex overflow-x-auto">
//             <button
//               onClick={() => setActiveTab("browse")}
//               className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
//                 activeTab === "browse"
//                   ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl"
//                   : "text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
//               }`}
//             >
//               <Search size={18} />
//               {user?.role === "buyer" ? "Find Freelancers" : "Find Work"}
//             </button>

//             {user?.role === "buyer" && (
//               <>
//                 <button
//                   onClick={() => setActiveTab("my-requests")}
//                   className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
//                     activeTab === "my-requests"
//                       ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl"
//                       : "text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
//                   }`}
//                 >
//                   <Briefcase size={18} />
//                   My Requests
//                 </button>

//                 <button
//                   onClick={() => setActiveTab("post-request")}
//                   className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
//                     activeTab === "post-request"
//                       ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl"
//                       : "text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
//                   }`}
//                 >
//                   <Plus size={18} />
//                   Post Request
//                 </button>
//               </>
//             )}

//             {user?.role === "seller" && (
//               <button
//                 onClick={() => setActiveTab("proposals")}
//                 className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
//                   activeTab === "proposals"
//                     ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl"
//                     : "text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
//                 }`}
//               >
//                 <Send size={18} />
//                 My Proposals
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Tab Content */}
//         <div className="mt-6">
//           {activeTab === "browse" && renderBrowseTab()}
//           {activeTab === "my-requests" && renderMyRequestsTab()}
//           {activeTab === "post-request" && renderPostRequestTab()}
//           {activeTab === "proposals" && renderProposalsTab()}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ServiceMarketplacePage;