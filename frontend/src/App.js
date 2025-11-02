// frontend/src/App.jsx - COMPLETE VERSION WITH ALL FIXES
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";

// Utils
const getToken = () => localStorage.getItem("token");
const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// Components
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BuyerDashboard from "./pages/BuyerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import ChatPage from "./pages/ChatPage";
import ServiceMarketplacePage from "./pages/ServiceMarketplacePage";
import FreelancerProfileSetup from "./pages/FreelancerProfileSetup";
import Cart from "./pages/Cart";
import PostServiceRequest from "./pages/PostServiceRequest";

// NEW: Freelancer/Service Request Pages
import ViewServiceRequests from "./pages/ViewServiceRequests";
import SubmitProposal from "./pages/SubmitProposal";

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
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

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
        <div className="flex flex-col items-center gap-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <Navbar user={user} setUser={setUser} />
        <Routes>
          {/* ============================================ */}
          {/* PUBLIC ROUTES */}
          {/* ============================================ */}
          <Route path="/" element={<Home user={user} />} />
          <Route path="/listing/:id" element={<ListingDetail user={user} />} />

          {/* ============================================ */}
          {/* AUTH ROUTES */}
          {/* ============================================ */}
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

          {/* ============================================ */}
          {/* BUYER ROUTES */}
          {/* ============================================ */}
          <Route
            path="/buyer-dashboard"
            element={
              <PrivateRoute allowedRoles={["buyer"]}>
                <BuyerDashboard user={user} />
              </PrivateRoute>
            }
          />

          {/* Buyer: Post Service Request */}
          <Route
            path="/post-service-request"
            element={
              <PrivateRoute allowedRoles={["buyer"]}>
                <PostServiceRequest user={user} />
              </PrivateRoute>
            }
          />

          {/* Buyer: View My Posted Requests */}
          <Route
            path="/my-requests"
            element={
              <PrivateRoute allowedRoles={["buyer"]}>
                <ViewServiceRequests user={user} filter="my-requests" />
              </PrivateRoute>
            }
          />

          {/* Buyer: Cart */}
          <Route
            path="/cart"
            element={
              <PrivateRoute allowedRoles={["buyer"]}>
                <Cart user={user} />
              </PrivateRoute>
            }
          />

          {/* ============================================ */}
          {/* SELLER/FREELANCER ROUTES */}
          {/* ============================================ */}
          <Route
            path="/seller-dashboard"
            element={
              <PrivateRoute allowedRoles={["seller"]}>
                <SellerDashboard user={user} />
              </PrivateRoute>
            }
          />

          {/* Seller: Setup Freelancer Profile */}
          <Route
            path="/freelancer/profile"
            element={
              <PrivateRoute allowedRoles={["seller"]}>
                <FreelancerProfileSetup user={user} />
              </PrivateRoute>
            }
          />

          {/* Seller: Browse Service Requests */}
          <Route
            path="/browse-requests"
            element={
              <PrivateRoute allowedRoles={["seller"]}>
                <ViewServiceRequests user={user} filter="all" />
              </PrivateRoute>
            }
          />

          {/* Seller: Submit Proposal */}
          <Route
            path="/submit-proposal/:requestId"
            element={
              <PrivateRoute allowedRoles={["seller"]}>
                <SubmitProposal user={user} />
              </PrivateRoute>
            }
          />

          {/* ============================================ */}
          {/* SHARED/PUBLIC PROFILE ROUTES */}
          {/* ============================================ */}
          {/* View any freelancer profile (public) */}
          <Route
            path="/freelancer/:userId"
            element={<FreelancerProfileSetup user={user} viewMode={true} />}
          />

          {/* ============================================ */}
          {/* SHARED AUTHENTICATED ROUTES */}
          {/* ============================================ */}
          {/* Service Marketplace - Available to all logged-in users */}
          <Route
            path="/marketplace"
            element={
              <PrivateRoute>
                <ServiceMarketplacePage user={user} />
              </PrivateRoute>
            }
          />

          {/* Checkout */}
          <Route
            path="/checkout/:orderId"
            element={
              <PrivateRoute>
                <Checkout user={user} />
              </PrivateRoute>
            }
          />

          {/* Payment Success */}
          <Route path="/payment-success" element={<PaymentSuccess />} />

          {/* Chat */}
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <ChatPage user={user} />
              </PrivateRoute>
            }
          />

          {/* ============================================ */}
          {/* 404 NOT FOUND */}
          {/* ============================================ */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-purple-600 mb-4">
                    404
                  </h1>
                  <p className="text-xl text-muted-foreground mb-6">
                    Page not found
                  </p>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            }
          />
        </Routes>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </BrowserRouter>
    </div>
  );
}

export default App;






























// // frontend/src/App.jsx - FINAL COMPLETE VERSION
// import React, { useState, useEffect } from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { Toaster } from "sonner";
// import "./App.css";
// import PostServiceRequest from "./pages/PostServiceRequest";

// // Utils
// const getToken = () => localStorage.getItem("token");
// const getUser = () => {
//   const user = localStorage.getItem("user");
//   return user ? JSON.parse(user) : null;
// };

// // Components
// import Navbar from "./components/Navbar";
// import Home from "./pages/Home";
// import ListingDetail from "./pages/ListingDetail";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import BuyerDashboard from "./pages/BuyerDashboard";
// import SellerDashboard from "./pages/SellerDashboard";
// import Checkout from "./pages/Checkout";
// import PaymentSuccess from "./pages/PaymentSuccess";
// import ChatPage from "./pages/ChatPage";
// import ServiceMarketplacePage from "./pages/ServiceMarketplacePage";
// import FreelancerProfileSetup from "./pages/FreelancerProfileSetup";
// import Cart from "./pages/Cart";

// // Add these imports to your existing App.js
// import ViewServiceRequests from "./pages/ViewServiceRequests";
// import SubmitProposal from "./pages/SubmitProposal";

// function App() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = getToken();
//     if (token) {
//       const userData = getUser();
//       setUser(userData);
//     }
//     setLoading(false);
//   }, []);

//   const PrivateRoute = ({ children, allowedRoles }) => {
//     if (loading) {
//       return (
//         <div className="min-h-screen flex items-center justify-center">
//           <div className="flex flex-col items-center gap-4">
//             <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
//             <p className="text-sm text-muted-foreground">Loading...</p>
//           </div>
//         </div>
//       );
//     }

//     if (!user) {
//       return <Navigate to="/login" replace />;
//     }

//     if (allowedRoles && !allowedRoles.includes(user.role)) {
//       return <Navigate to="/" replace />;
//     }

//     return children;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="flex flex-col items-center gap-4">
//           <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
//           <p className="text-sm text-muted-foreground">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="App min-h-screen bg-background">
//       <BrowserRouter>
//         <Navbar user={user} setUser={setUser} />
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/" element={<Home user={user} />} />
//           <Route path="/listing/:id" element={<ListingDetail user={user} />} />
//           {/* Auth Routes */}
//           <Route
//             path="/login"
//             element={user ? <Navigate to="/" /> : <Login setUser={setUser} />}
//           />
//           <Route
//             path="/register"
//             element={
//               user ? <Navigate to="/" /> : <Register setUser={setUser} />
//             }
//           />
//           {/* Buyer Routes */}
//           <Route
//             path="/buyer-dashboard"
//             element={
//               <PrivateRoute allowedRoles={["buyer"]}>
//                 <BuyerDashboard user={user} />
//               </PrivateRoute>
//             }
//           />
//           {/* Seller Routes */}
//           <Route
//             path="/seller-dashboard"
//             element={
//               <PrivateRoute allowedRoles={["seller"]}>
//                 <SellerDashboard user={user} />
//               </PrivateRoute>
//             }
//           />
//           {/* Freelancer Profile Routes */}
//           <Route
//             path="/freelancer/profile"
//             element={
//               <PrivateRoute allowedRoles={["seller"]}>
//                 <FreelancerProfileSetup user={user} />
//               </PrivateRoute>
//             }
//           />
//           {/* View any freelancer profile (public) */}
//           <Route
//             path="/freelancer/:userId"
//             element={<FreelancerProfileSetup user={user} />}
//           />
//           {/* Service Marketplace - Available to all logged-in users */}
//           <Route
//             path="/marketplace"
//             element={
//               <PrivateRoute>
//                 <ServiceMarketplacePage user={user} />
//               </PrivateRoute>
//             }
//           />
//           {/* Cart - Buyer only */}
//           <Route
//             path="/cart"
//             element={
//               <PrivateRoute allowedRoles={["buyer"]}>
//                 <Cart user={user} />
//               </PrivateRoute>
//             }
//           />
//           {/* Shared Private Routes */}
//           <Route
//             path="/checkout/:orderId"
//             element={
//               <PrivateRoute>
//                 <Checkout user={user} />
//               </PrivateRoute>
//             }
//           />
//           <Route path="/payment-success" element={<PaymentSuccess />} />
//           <Route
//             path="/chat"
//             element={
//               <PrivateRoute>
//                 <ChatPage user={user} />
//               </PrivateRoute>
//             }
//           />

//           {/* // In your routes: */}
//           <Route
//             path="/post-service-request"
//             element={<PostServiceRequest />}
//           />

//           {/* 404 Catch All */}
//           <Route
//             path="*"
//             element={
//               <div className="min-h-screen flex items-center justify-center">
//                 <div className="text-center">
//                   <h1 className="text-6xl font-bold text-purple-600 mb-4">
//                     404
//                   </h1>
//                   <p className="text-xl text-muted-foreground mb-6">
//                     Page not found
//                   </p>
//                   <button
//                     onClick={() => (window.location.href = "/")}
//                     className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
//                   >
//                     Go Home
//                   </button>
//                 </div>
//               </div>
//             }
//           />
//         </Routes>

//         {/* Toast Notifications */}
//         <Toaster
//           position="top-right"
//           richColors
//           closeButton
//           toastOptions={{
//             duration: 4000,
//             style: {
//               background: "var(--background)",
//               color: "var(--foreground)",
//               border: "1px solid var(--border)",
//             },
//           }}
//         />
//       </BrowserRouter>
//     </div>
//   );
// }

// export default App;
