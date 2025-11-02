// frontend/src/pages/ListingDetail.jsx - COMPLETE INTEGRATED VERSION
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Star,
  ShoppingCart,
  Calendar,
  X,
  MapPin,
  Clock,
  DollarSign,
  Package,
  Shield,
} from "lucide-react";
import BookingCalendar from "../components/BookingCalendar";
import { toast } from "sonner";

const ListingDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    fetchListing();
    fetchReviews();
    checkWishlist();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/listings/${id}`);
      if (!response.ok) throw new Error("Listing not found");
      const data = await response.json();
      setListing(data);
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast.error("Failed to load listing");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/reviews/${id}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const checkWishlist = async () => {
    if (!user) return;

    try {
      const response = await fetch("http://localhost:8000/api/wishlist", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const wishlist = await response.json();
        setInWishlist(wishlist.some((item) => item.id === id));
      }
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const handleOrder = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyers can place orders");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/orders?listing_id=${id}&quantity=${quantity}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create order");
      }

      const order = await response.json();
      toast.success("Order created successfully!");
      navigate("/buyer-dashboard");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Failed to create order");
    }
  };

  const handleBookService = () => {
    if (!user) {
      toast.error("Please login to book this service");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyers can book services");
      return;
    }

    setShowBookingModal(true);
  };

  const handleBookingComplete = (booking) => {
    setShowBookingModal(false);
    toast.success("Booking confirmed! Check your dashboard for details.");
    navigate("/buyer-dashboard");
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to add to wishlist");
      navigate("/login");
      return;
    }

    try {
      const method = inWishlist ? "DELETE" : "POST";
      const response = await fetch(`http://localhost:8000/api/wishlist/${id}`, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setInWishlist(!inWishlist);
        toast.success(
          inWishlist ? "Removed from wishlist" : "Added to wishlist"
        );
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Failed to update wishlist");
    }
  };

  const handleMessageSeller = () => {
    if (!user) {
      toast.error("Please login to message the seller");
      navigate("/login");
      return;
    }

    if (user.id === listing.seller_id) {
      toast.error("You cannot message yourself");
      return;
    }

    navigate(`/chat?user=${listing.seller_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Listing not found
          </h2>
          <button
            onClick={() => navigate("/")}
            className="text-purple-600 hover:text-purple-700"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const isService = listing.type === "service";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            <div className="relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center text-gray-400">
                  <Package className="w-16 h-16" />
                </div>
              )}

              {/* Wishlist Button */}
              <button
                onClick={toggleWishlist}
                className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Heart
                  className={`w-6 h-6 ${
                    inWishlist
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                />
              </button>
            </div>

            {/* Additional Images */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {listing.images.slice(1, 5).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${listing.title} ${index + 2}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {listing.title}
                </h1>
                {listing.verified && (
                  <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm">
                    <Shield className="w-4 h-4" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {listing.rating || 0} ({listing.reviews_count || 0} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  By {listing.seller_name}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                ${listing.price}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {isService ? "/ session" : "/ unit"}
              </span>
            </div>

            {/* Category & Type */}
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                {listing.category}
              </span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-full text-sm">
                {isService ? "📋 Service" : "📦 Product"}
              </span>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Description
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Stock (for products) */}
            {!isService && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {listing.stock > 0
                    ? `${listing.stock} in stock`
                    : "Out of stock"}
                </span>
              </div>
            )}

            {/* Message Seller Section */}
            {user && user.id !== listing.seller_id && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <MessageCircle
                      className="text-blue-600 dark:text-blue-400"
                      size={20}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Have questions?</p>
                    <p className="text-xs text-muted-foreground">
                      Chat with the seller directly
                    </p>
                  </div>
                  <button
                    onClick={handleMessageSeller}
                    className="px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors flex items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Message
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {isService ? (
                <button
                  onClick={handleBookService}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2 transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Book Now - ${listing.price}/session
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantity:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={listing.stock}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={handleOrder}
                    disabled={listing.stock === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {listing.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </>
              )}
            </div>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Customer Reviews
          </h2>

          {reviews.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              No reviews yet. Be the first to review!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {review.user_name}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">Book {listing.title}</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <BookingCalendar
                service={listing}
                onBookingComplete={handleBookingComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
