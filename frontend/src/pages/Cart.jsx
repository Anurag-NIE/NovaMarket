// frontend/src/pages/Cart.jsx - COMPLETE IMPLEMENTATION
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import api from "../utils/api";
import { toast } from "sonner";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
} from "lucide-react";

const Cart = ({ user }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadCart();
  }, [user, navigate]);

  const loadCart = async () => {
    try {
      setLoading(true);
      // Cart items are stored in localStorage for simplicity
      const stored = localStorage.getItem(`cart_${user.id}`);
      if (stored) {
        const items = JSON.parse(stored);
        // Fetch full listing details
        const detailed = await Promise.all(
          items.map(async (item) => {
            try {
              const response = await api.get(`/listings/${item.listingId}`);
              return {
                ...response.data,
                quantity: item.quantity,
              };
            } catch (error) {
              console.error(`Failed to load listing ${item.listingId}:`, error);
              return null;
            }
          })
        );
        setCartItems(detailed.filter(Boolean));
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (listingId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedItems = cartItems.map((item) =>
      item.id === listingId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);

    // Save to localStorage
    const cartData = updatedItems.map((item) => ({
      listingId: item.id,
      quantity: item.quantity,
    }));
    localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartData));
  };

  const removeItem = (listingId) => {
    const updated = cartItems.filter((item) => item.id !== listingId);
    setCartItems(updated);

    const cartData = updated.map((item) => ({
      listingId: item.id,
      quantity: item.quantity,
    }));
    localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartData));
    toast.success("Item removed from cart");
  };

  const checkout = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setUpdating(true);
    try {
      // Create orders for each item
      const orderPromises = cartItems.map((item) =>
        api.post(`/orders?listing_id=${item.id}&quantity=${item.quantity}`)
      );

      const orders = await Promise.all(orderPromises);

      // Clear cart
      localStorage.removeItem(`cart_${user.id}`);
      setCartItems([]);

      toast.success(`${orders.length} order(s) created successfully!`);

      // Redirect to first order checkout
      if (orders.length > 0) {
        navigate(`/checkout/${orders[0].data.id}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.detail || "Checkout failed");
    } finally {
      setUpdating(false);
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

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
          <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
            <ShoppingCart size={32} />
            Shopping Cart
          </h1>
          <p className="text-muted-foreground">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in
            your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="pt-10 pb-10 text-center">
              <Package
                size={48}
                className="mx-auto text-muted-foreground mb-4"
              />
              <p className="text-lg font-medium mb-2">Your cart is empty</p>
              <p className="text-muted-foreground mb-4">
                Start shopping to add items to your cart
              </p>
              <Button onClick={() => navigate("/")}>Start Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.images && item.images[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package
                              className="text-muted-foreground"
                              size={32}
                            />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          By {item.seller_name}
                        </p>
                        <Badge>{item.category}</Badge>
                      </div>

                      {/* Price & Quantity */}
                      <div className="text-right">
                        <p className="text-2xl font-bold mb-3">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>

                        <div className="flex items-center gap-2 mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= (item.stock || 99)}
                          >
                            <Plus size={14} />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <h3 className="text-xl font-semibold">Order Summary</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${(total * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-border my-2"></div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>${(total * 1.1).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={checkout}
                    disabled={updating || cartItems.length === 0}
                  >
                    {updating ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Checkout
                        <ArrowRight size={18} className="ml-2" />
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

// USAGE: Add to your routes:
// <Route path="/cart" element={<Cart user={user} />} />
