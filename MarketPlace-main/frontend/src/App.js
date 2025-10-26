import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { getToken, getUser } from "./utils/auth";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BuyerDashboard from "./pages/BuyerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import ServicesPage from "./pages/ServicesPage";
import ChatPage from "./pages/ChatPage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const userData = getUser();
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const PrivateRoute = ({ children, allowedRoles }) => {
    if (loading)
      return (
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      );

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar user={user} setUser={setUser} />
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/product/:id" element={<ProductDetail user={user} />} />

          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login setUser={setUser} />}
          />
          <Route
            path="/register"
            element={
              user ? <Navigate to="/" /> : <Register setUser={setUser} />
            }
          />

          <Route
            path="/buyer-dashboard"
            element={
              <PrivateRoute allowedRoles={["buyer"]}>
                <BuyerDashboard user={user} />
              </PrivateRoute>
            }
          />

          <Route
            path="/seller-dashboard"
            element={
              <PrivateRoute allowedRoles={["seller"]}>
                <SellerDashboard user={user} />
              </PrivateRoute>
            }
          />

          <Route
            path="/checkout/:orderId"
            element={
              <PrivateRoute>
                <Checkout user={user} />
              </PrivateRoute>
            }
          />

          <Route path="/payment-success" element={<PaymentSuccess />} />

          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <ChatPage user={user} />
              </PrivateRoute>
            }
          />

          {/* ✅ ADD THIS ROUTE */}
          <Route path="/services" element={<ServicesPage user={user} />} />
        </Routes>

        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
