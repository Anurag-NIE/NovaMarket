// // frontend/src/pages/SellerDashboard.jsx - UPDATED
// import React, { useState } from "react";
// import AnalyticsDashboard from "../components/AnalyticsDashboard";
// // KEEP your existing imports

// const SellerDashboard = () => {
//   const [activeTab, setActiveTab] = useState("listings"); // listings, bookings, analytics

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold mb-6">Provider Dashboard</h1>

//       {/* Tabs */}
//       <div className="flex gap-4 border-b border-gray-200 mb-8">
//         <button
//           onClick={() => setActiveTab("listings")}
//           className={`pb-4 px-2 font-medium transition-colors ${
//             activeTab === "listings"
//               ? "border-b-2 border-purple-600 text-purple-600"
//               : "text-gray-600 hover:text-gray-900"
//           }`}
//         >
//           My Services
//         </button>

//         {/* NEW: Bookings Tab */}
//         <button
//           onClick={() => setActiveTab("bookings")}
//           className={`pb-4 px-2 font-medium transition-colors ${
//             activeTab === "bookings"
//               ? "border-b-2 border-purple-600 text-purple-600"
//               : "text-gray-600 hover:text-gray-900"
//           }`}
//         >
//           Bookings
//         </button>

//         {/* NEW: Analytics Tab */}
//         <button
//           onClick={() => setActiveTab("analytics")}
//           className={`pb-4 px-2 font-medium transition-colors ${
//             activeTab === "analytics"
//               ? "border-b-2 border-purple-600 text-purple-600"
//               : "text-gray-600 hover:text-gray-900"
//           }`}
//         >
//           Analytics
//         </button>

//         {/* KEEP: Orders Tab */}
//         <button
//           onClick={() => setActiveTab("orders")}
//           className={`pb-4 px-2 font-medium transition-colors ${
//             activeTab === "orders"
//               ? "border-b-2 border-purple-600 text-purple-600"
//               : "text-gray-600 hover:text-gray-900"
//           }`}
//         >
//           Orders
//         </button>
//       </div>

//       {/* Content */}
//       {activeTab === "listings" && (
//         <div>{/* KEEP YOUR EXISTING LISTINGS CODE */}</div>
//       )}

//       {activeTab === "bookings" && <BookingsManagement />}

//       {activeTab === "analytics" && <AnalyticsDashboard />}

//       {activeTab === "orders" && (
//         <div>{/* KEEP YOUR EXISTING ORDERS CODE */}</div>
//       )}
//     </div>
//   );
// };

// // NEW: Bookings Management Component
// const BookingsManagement = () => {
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadBookings();
//   }, []);

//   const loadBookings = async () => {
//     try {
//       const response = await api.get("/bookings/my-bookings");
//       setBookings(response.data.bookings);
//     } catch (error) {
//       console.error("Error loading bookings:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <div className="text-center py-8">Loading bookings...</div>;
//   }

//   return (
//     <div className="space-y-4">
//       <h2 className="text-2xl font-semibold">Your Bookings</h2>

//       {bookings.length === 0 ? (
//         <div className="text-center py-12 bg-gray-50 rounded-lg">
//           <p className="text-gray-600">No bookings yet</p>
//         </div>
//       ) : (
//         <div className="grid gap-4">
//           {bookings.map((booking) => (
//             <div
//               key={booking.id}
//               className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500"
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-lg">
//                     {booking.client_name}
//                   </h3>
//                   <p className="text-gray-600 mt-1">
//                     {new Date(booking.start_time).toLocaleString()}
//                   </p>
//                   <p className="text-sm text-gray-500 mt-2">
//                     Duration: {booking.duration_minutes} minutes
//                   </p>
//                   {booking.notes && (
//                     <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
//                       Note: {booking.notes}
//                     </p>
//                   )}
//                 </div>

//                 <div className="text-right">
//                   <span
//                     className={`
//                     inline-block px-3 py-1 rounded-full text-sm font-semibold
//                     ${
//                       booking.status === "confirmed"
//                         ? "bg-green-100 text-green-700"
//                         : booking.status === "completed"
//                         ? "bg-blue-100 text-blue-700"
//                         : "bg-red-100 text-red-700"
//                     }
//                   `}
//                   >
//                     {booking.status}
//                   </span>
//                   <p className="text-xl font-bold text-purple-600 mt-2">
//                     ${booking.price}
//                   </p>

//                   {booking.meeting_link && (
//                     <a
//                       href={booking.meeting_link}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="inline-block mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all"
//                     >
//                       Join Meeting
//                     </a>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SellerDashboard;
















import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import ListingCard from "../components/ListingCard";
import AvailabilitySettings from "../components/AvailabilitySettings";
import api from "../utils/api";
import { toast } from "sonner";
import {
  Plus,
  Package,
  DollarSign,
  Eye,
  TrendingUp,
  Calendar,
  Clock,
  Video,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const categories = [
  "Electronics",
  "Fashion",
  "Home",
  "Books",
  "Sports",
  "Beauty",
  "Toys",
  "Services",
];

const SellerDashboard = ({ user }) => {
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddListing, setShowAddListing] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    images: "",
    stock: "1",
    type: "product",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [listingsRes, ordersRes, bookingsRes] = await Promise.all([
        api.get("/listings"),
        api.get("/orders"),
        api.get("/bookings/my-bookings"),
      ]);

      const myListings = listingsRes.data.filter(
        (p) => p.seller_id === user.id
      );
      setListings(myListings);
      setOrders(ordersRes.data);
      setBookings(bookingsRes.data.bookings || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddListing = async (e) => {
    e.preventDefault();

    try {
      const images = formData.images
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean);
      if (images.length === 0) {
        images.push(
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
        );
      }

      const dataToSend = {
        ...formData,
        price: parseFloat(formData.price),
        images,
        tags: [],
      };

      if (formData.type === "product") {
        dataToSend.stock = parseInt(formData.stock);
      } else {
        delete dataToSend.stock;
      }

      await api.post("/listings", dataToSend);

      toast.success("Listing added successfully!");
      setShowAddListing(false);
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "",
        images: "",
        stock: "1",
        type: "product",
      });
      fetchData();
    } catch (error) {
      console.error("Error adding listing:", error);
      toast.error(error.response?.data?.detail || "Failed to add listing");
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/complete`);
      toast.success("Booking marked as completed");
      fetchData();
    } catch (error) {
      console.error("Error completing booking:", error);
      toast.error(error.response?.data?.detail || "Failed to complete booking");
    }
  };

  const openAvailabilitySettings = (service) => {
    setSelectedService(service);
    setShowAvailability(true);
  };

  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );
  const totalViews = listings.reduce(
    (sum, listing) => sum + (listing.reviews_count || 0),
    0
  );
  const serviceListings = listings.filter((l) => l.type === "service");

  // Chart data
  const chartData = [
    { day: "Mon", sales: 1200, views: 4600 },
    { day: "Tue", sales: 980, views: 5200 },
    { day: "Wed", sales: 1400, views: 6100 },
    { day: "Thu", sales: 900, views: 4300 },
    { day: "Fri", sales: 1700, views: 7200 },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Seller Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
          </div>
          <Dialog open={showAddListing} onOpenChange={setShowAddListing}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={18} className="mr-2" />
                Add Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Listing</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddListing} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title*</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description*</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD)*</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type*</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.type === "product" && (
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock*</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="1"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="category">Category*</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="images">Image URLs (comma-separated)</Label>
                  <Input
                    id="images"
                    value={formData.images}
                    onChange={(e) =>
                      setFormData({ ...formData, images: e.target.value })
                    }
                    placeholder="https://example.com/image1.jpg, ..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default image
                  </p>
                </div>
                <Button type="submit" className="w-full">
                  Add Listing
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{listings.length}</p>
                  <p className="text-sm text-muted-foreground">Listings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="text-emerald-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ${totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-sm text-muted-foreground">Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Calendar className="text-purple-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground">Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-lg font-semibold">Sales & Views Overview</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 6, right: 6 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(202 84% 38%)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(202 84% 38%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(202 84% 38%)"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="listings">
          <TabsList>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            {listings.length > 0 ? (
              <div className="space-y-6">
                {serviceListings.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Services - Manage Availability
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {serviceListings.map((service) => (
                        <Card key={service.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <img
                                src={service.images[0]}
                                alt={service.title}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  {service.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  ${service.price}/session
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() =>
                                    openAvailabilitySettings(service)
                                  }
                                >
                                  <Clock size={14} className="mr-2" />
                                  Set Availability
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-4">All Listings</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-10 pb-10 text-center">
                  <Package
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No listings yet</p>
                  <p className="text-muted-foreground mb-4">
                    Start selling by adding your first listing
                  </p>
                  <Button onClick={() => setShowAddListing(true)}>
                    Add Listing
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {booking.service_title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Client: {booking.client_name}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-2">
                          <Calendar
                            className="text-muted-foreground mt-0.5"
                            size={18}
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Date
                            </p>
                            <p className="font-medium">
                              {format(
                                new Date(booking.start_time),
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock
                            className="text-muted-foreground mt-0.5"
                            size={18}
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Time
                            </p>
                            <p className="font-medium">
                              {format(new Date(booking.start_time), "h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <DollarSign
                            className="text-muted-foreground mt-0.5"
                            size={18}
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Price
                            </p>
                            <p className="font-medium">${booking.price}</p>
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">
                            Client Notes:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        {booking.meeting_link && (
                          <Button
                            onClick={() =>
                              window.open(booking.meeting_link, "_blank")
                            }
                            size="sm"
                          >
                            <Video size={16} className="mr-2" />
                            Start Meeting
                          </Button>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteBooking(booking.id)}
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-10 pb-10 text-center">
                  <Calendar
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No bookings yet</p>
                  <p className="text-muted-foreground">
                    Bookings will appear here when clients book your services
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {order.listing_title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Order from: {order.buyer_name}
                          </p>
                        </div>
                        <Badge>{order.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">
                            ${order.total_amount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment</p>
                          <p className="font-medium capitalize">
                            {order.payment_status}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-10 pb-10 text-center">
                  <TrendingUp
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No orders yet</p>
                  <p className="text-muted-foreground">
                    Orders will appear here once customers purchase your
                    listings
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Availability Settings Modal */}
      <Dialog open={showAvailability} onOpenChange={setShowAvailability}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Set Availability for {selectedService?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedService && (
            <AvailabilitySettings
              serviceId={selectedService.id}
              serviceName={selectedService.title}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerDashboard;