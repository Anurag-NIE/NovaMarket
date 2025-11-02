import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import ListingCard from "../components/ListingCard";
import api from "../utils/api";
import { toast } from "sonner";
import {
  ShoppingBag,
  Heart,
  Package,
  Calendar,
  Video,
  Clock,
  XCircle,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";

const BuyerDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, wishlistRes, bookingsRes] = await Promise.all([
        api.get("/orders"),
        api.get("/wishlist"),
        api.get("/bookings/my-bookings"),
      ]);
      setOrders(ordersRes.data);
      setWishlist(wishlistRes.data);
      setBookings(bookingsRes.data.bookings || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled successfully");
      fetchData();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.detail || "Failed to cancel booking");
    }
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Buyer Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShoppingBag className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Calendar className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground">Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Heart className="text-accent" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{wishlist.length}</p>
                  <p className="text-sm text-muted-foreground">Wishlist</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Package className="text-emerald-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {orders.filter((o) => o.status === "delivered").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          </TabsList>

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
                            Order ID: {order.id.slice(0, 8)}...
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
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
                  <ShoppingBag
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No orders yet</p>
                  <p className="text-muted-foreground">
                    Start shopping to see your orders here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            {bookings.length > 0 ? (
              <div className="space-y-4">
                // In the bookings mapping
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {booking.service_title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            with {booking.provider_name}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <Calendar
                              size={16}
                              className="inline mr-2 text-muted-foreground"
                            />
                            <span>
                              {new Date(
                                booking.start_time
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <Clock
                              size={16}
                              className="inline mr-2 text-muted-foreground"
                            />
                            <span>
                              {new Date(
                                booking.start_time
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                          <div>
                            <DollarSign
                              size={16}
                              className="inline mr-2 text-muted-foreground"
                            />
                            <span>${booking.price}</span>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="p-3 bg-muted rounded-lg text-sm">
                            <strong>Notes:</strong> {booking.notes}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {booking.meeting_link &&
                            booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  window.open(booking.meeting_link, "_blank")
                                }
                              >
                                <Video size={16} className="mr-2" />
                                Join Meeting
                              </Button>
                            )}
                          {booking.status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
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
                    Book services to see your appointments here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6">
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {wishlist.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-10 pb-10 text-center">
                  <Heart
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No items in wishlist</p>
                  <p className="text-muted-foreground">
                    Save listings you like to view them later
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BuyerDashboard;
