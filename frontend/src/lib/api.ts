// // frontend/lib/api.ts
// const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// // Generic API call wrapper
// async function apiCall<T>(
//   endpoint: string,
//   options: RequestInit = {}
// ): Promise<T> {
//   const token = localStorage.getItem("token");

//   const headers: HeadersInit = {
//     "Content-Type": "application/json",
//     ...(token && { Authorization: `Bearer ${token}` }),
//     ...options.headers,
//   };

//   const response = await fetch(`${API_BASE}${endpoint}`, {
//     ...options,
//     headers,
//   });

//   if (!response.ok) {
//     const error = await response
//       .json()
//       .catch(() => ({ detail: "Request failed" }));
//     throw new Error(error.detail || `HTTP ${response.status}`);
//   }

//   return response.json();
// }

// // ============ BOOKING API ============

// export interface TimeSlot {
//   start: string; // "HH:MM"
//   end: string; // "HH:MM"
// }

// export interface AvailabilitySlot {
//   start: string; // ISO datetime
//   end: string;
//   available: boolean;
//   locked: boolean;
//   booked: boolean;
// }

// export interface Booking {
//   id: string;
//   service_id: string;
//   service_title: string;
//   provider_id: string;
//   provider_name: string;
//   client_id: string;
//   client_name: string;
//   start_time: string;
//   end_time: string;
//   duration_minutes: number;
//   price: number;
//   status: "pending" | "confirmed" | "completed" | "cancelled";
//   notes?: string;
//   meeting_link?: string;
//   created_at: string;
// }

// export const bookingApi = {
//   // Set weekly availability
//   setAvailability: (data: {
//     service_id: string;
//     day_of_week: number;
//     time_slots: TimeSlot[];
//   }) =>
//     apiCall("/api/availability", {
//       method: "POST",
//       body: JSON.stringify(data),
//     }),

//   // Get service availability
//   getAvailability: (serviceId: string) =>
//     apiCall<{ availability: any[] }>(`/api/availability/${serviceId}`),

//   // Get available slots for a date
//   getAvailableSlots: (serviceId: string, date: string) =>
//     apiCall<{ slots: AvailabilitySlot[] }>(
//       `/api/availability/${serviceId}/slots?date=${date}`
//     ),

//   // Create booking
//   createBooking: (data: {
//     service_id: string;
//     start_time: string;
//     duration_minutes: number;
//     notes?: string;
//   }) =>
//     apiCall<{ booking: Booking }>("/api/bookings", {
//       method: "POST",
//       body: JSON.stringify(data),
//     }),

//   // Get user bookings
//   getMyBookings: (status?: string) => {
//     const url = status
//       ? `/api/bookings/my?status=${status}`
//       : "/api/bookings/my";
//     return apiCall<{ bookings: Booking[] }>(url);
//   },

//   // Cancel booking
//   cancelBooking: (bookingId: string) =>
//     apiCall(`/api/bookings/${bookingId}/cancel`, { method: "POST" }),

//   // Generate meeting link
//   generateMeetingLink: (bookingId: string) =>
//     apiCall<{ meeting_link: string }>(
//       `/api/bookings/${bookingId}/meeting-link`,
//       { method: "POST" }
//     ),
// };

// // ============ LISTING API (for services) ============

// export interface Listing {
//   id: string;
//   seller_id: string;
//   seller_name: string;
//   title: string;
//   description: string;
//   price: number;
//   category: string;
//   images: string[];
//   type: "product" | "service";
//   verified: boolean;
//   rating: number;
//   reviews_count: number;
//   created_at: string;
// }

// export const listingApi = {
//   // Get all listings
//   getListings: (type?: string) => {
//     const url = type ? `/api/listings?type=${type}` : "/api/listings";
//     return apiCall<{ listings: Listing[] }>(url);
//   },

//   // Get single listing
//   getListing: (id: string) =>
//     apiCall<{ listing: Listing }>(`/api/listings/${id}`),

//   // Create listing
//   createListing: (data: {
//     title: string;
//     description: string;
//     price: number;
//     category: string;
//     images: string[];
//     type: "product" | "service";
//   }) =>
//     apiCall<{ listing: Listing }>("/api/listings", {
//       method: "POST",
//       body: JSON.stringify(data),
//     }),
// };

// // ============ AUTH API ============

// export const authApi = {
//   login: (email: string, password: string) =>
//     apiCall<{ access_token: string; user: any }>("/api/auth/login", {
//       method: "POST",
//       body: JSON.stringify({ email, password }),
//     }),

//   signup: (data: {
//     email: string;
//     password: string;
//     name: string;
//     role: string;
//   }) =>
//     apiCall<{ access_token: string; user: any }>("/api/auth/signup", {
//       method: "POST",
//       body: JSON.stringify(data),
//     }),

//   getProfile: () => apiCall<{ user: any }>("/api/auth/me"),
// };

// export default apiCall;
