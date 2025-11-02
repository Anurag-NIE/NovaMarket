import React, { useState, useEffect } from "react";
import { format, addDays, parseISO } from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  User,
} from "lucide-react";

// 🕒 Timezone-safe helpers
const today = new Date();
today.setHours(0, 0, 0, 0);

// Generate only future dates (14 days)
const generateDates = () => {
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return date;
  });
};

const BookingCalendar = ({ service, onBookingComplete }) => {
  const [dates] = useState(generateDates());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [duration, setDuration] = useState(30);

  const API_URL = "http://localhost:8000/api";
  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(
        `${API_URL}/bookings/available-slots/${service.id}?date=${dateStr}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to load slots");
        // Generate default slots if API fails
        const defaultSlots = generateDefaultSlots(selectedDate);
        setAvailableSlots(defaultSlots);
        return;
      }

      const data = await response.json();
      const slots = data.slots || [];

      // If no slots returned, generate default ones
      if (slots.length === 0) {
        const defaultSlots = generateDefaultSlots(selectedDate);
        setAvailableSlots(defaultSlots);
      } else {
        setAvailableSlots(slots);
      }
    } catch (error) {
      console.error("Error loading slots:", error);
      // Fallback to default slots
      const defaultSlots = generateDefaultSlots(selectedDate);
      setAvailableSlots(defaultSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Generate default time slots from 9 AM to 5 PM
  const generateDefaultSlots = (date) => {
    const slots = [];
    const baseDate = new Date(date);
    const now = new Date();

    for (let hour = 9; hour < 17; hour++) {
      for (let minute of [0, 30]) {
        const slotTime = new Date(baseDate);
        slotTime.setHours(hour, minute, 0, 0);

        // Only include future slots
        if (slotTime > now) {
          const endTime = new Date(slotTime);
          endTime.setMinutes(endTime.getMinutes() + 30);

          slots.push({
            start: slotTime.toISOString(),
            end: endTime.toISOString(),
            available: true,
          });
        }
      }
    }

    return slots;
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    try {
      // Try to lock the slot first (optional - may not be implemented)
      try {
        await fetch(`${API_URL}/bookings/lock-slot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            service_id: service.id,
            start_time: selectedSlot.start,
          }),
        });
      } catch (lockError) {
        console.log("Slot locking not available, proceeding with booking");
      }

      // Create booking
      const bookingResponse = await fetch(`${API_URL}/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          service_id: service.id,
          start_time: selectedSlot.start,
          duration_minutes: duration,
          notes: notes || undefined,
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.detail || "Failed to create booking");
      }

      const data = await bookingResponse.json();
      setBookingDetails(data.booking);
      setBookingSuccess(true);

      if (onBookingComplete) {
        onBookingComplete(data.booking);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert(error.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (bookingSuccess && bookingDetails) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle className="text-white" size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Booking Confirmed!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your appointment has been successfully scheduled
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 space-y-4 border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar
                className="text-purple-600 dark:text-purple-400"
                size={24}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Service
              </p>
              <p className="font-bold text-lg">{service.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-500" size={20} />
              <div>
                <p className="text-xs text-gray-500">Date & Time</p>
                <p className="font-semibold text-sm">
                  {format(parseISO(bookingDetails.start_time), "MMM d, yyyy")}
                </p>
                <p className="text-sm text-gray-600">
                  {format(parseISO(bookingDetails.start_time), "h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="text-green-500" size={20} />
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-bold text-lg text-green-600">
                  $
                  {bookingDetails.price ||
                    (service.price * (duration / 30)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="text-gray-500" size={20} />
            <div>
              <p className="text-xs text-gray-500">Provider</p>
              <p className="font-semibold">
                {bookingDetails.provider_name || service.seller_name}
              </p>
            </div>
          </div>

          {bookingDetails.meeting_link && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <a
                href={bookingDetails.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                🎥 Join Meeting
              </a>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            if (onBookingComplete) {
              // Close modal and navigate
              window.location.href = "/buyer-dashboard";
            } else {
              window.location.href = "/buyer-dashboard";
            }
          }}
          className="w-full mt-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          View My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Book Your Appointment
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Select a date and time for{" "}
          <span className="font-semibold">{service.title}</span>
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-3 rounded-full border-2 border-green-200 dark:border-green-700">
          <DollarSign className="text-green-600" size={24} />
          <span className="text-2xl font-bold text-green-600">
            ${service.price}
          </span>
          <span className="text-gray-500">/ session</span>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
          <Calendar size={24} className="text-purple-600" />
          Select Date
        </h3>
        <div className="grid grid-cols-7 gap-3">
          {dates.map((date) => {
            const isSelected =
              selectedDate &&
              format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            const isToday =
              format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`
                  p-4 rounded-xl border-2 transition-all text-center hover:scale-105
                  ${
                    isSelected
                      ? "border-purple-600 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 shadow-lg"
                      : "border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  }
                  ${isToday ? "ring-2 ring-blue-400 ring-offset-2" : ""}
                `}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {format(date, "EEE")}
                </div>
                <div className="text-2xl font-bold my-1">
                  {format(date, "d")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {format(date, "MMM")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Clock size={24} className="text-blue-600" />
            Available Time Slots
          </h3>

          {loadingSlots ? (
            <div className="text-center py-16">
              <Loader2
                className="animate-spin mx-auto mb-4 text-purple-600"
                size={48}
              />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Loading available slots...
              </p>
            </div>
          ) : availableSlots.filter((s) => s.available).length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">
                No available slots for this date
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Please select another date
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {availableSlots
                .filter((slot) => slot.available)
                .map((slot, idx) => {
                  const slotTime = parseISO(slot.start);
                  const isSelected =
                    selectedSlot && selectedSlot.start === slot.start;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        p-4 rounded-xl border-2 transition-all font-semibold text-center hover:scale-105
                        ${
                          isSelected
                            ? "border-purple-600 bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg"
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        }
                      `}
                    >
                      {format(slotTime, "h:mm a")}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Duration & Notes */}
      {selectedSlot && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
          <div>
            <label className="font-semibold mb-2 block text-lg">
              Session Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 font-medium"
            >
              <option value={30}>30 minutes - ${service.price}</option>
              <option value={60}>
                60 minutes - ${(service.price * 2).toFixed(2)}
              </option>
              <option value={90}>
                90 minutes - ${(service.price * 3).toFixed(2)}
              </option>
            </select>
          </div>

          <div>
            <label className="font-semibold mb-2 block text-lg">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or notes for the provider..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900"
            />
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {selectedSlot && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <button
            onClick={handleBooking}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Creating Booking...
              </>
            ) : (
              <>
                <CheckCircle size={24} />
                Confirm Booking - $
                {(service.price * (duration / 30)).toFixed(2)}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;

// import React, { useState, useEffect } from "react";
// import { format, addDays, parseISO, isBefore, startOfDay } from "date-fns";
// import {
//   Calendar,
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   Loader2,
//   MapPin,
//   DollarSign,
//   User,
// } from "lucide-react";

// // 🕒 Timezone-safe helpers & validation
// const today = new Date();
// today.setHours(0, 0, 0, 0);

// const formatDate = (date) => {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// };

// const formatTime = (date) => {
//   const hours = date.getHours();
//   const minutes = date.getMinutes();
//   const ampm = hours >= 12 ? 'PM' : 'AM';
//   const displayHours = hours % 12 || 12;
//   return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
// };

// // Generate only future dates (14 days)
// const dates = Array.from({ length: 14 }, (_, i) => {
//   const date = new Date(today);
//   date.setDate(date.getDate() + i);
//   return date;
// });

// const BookingCalendar = ({ service, onBookingComplete }) => {
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [availableSlots, setAvailableSlots] = useState([]);
//   const [selectedSlot, setSelectedSlot] = useState(null);
//   const [notes, setNotes] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [loadingSlots, setLoadingSlots] = useState(false);
//   const [bookingSuccess, setBookingSuccess] = useState(false);
//   const [bookingDetails, setBookingDetails] = useState(null);
//   const [duration, setDuration] = useState(30);

//   const API_URL = "http://localhost:8000/api";
//   const getToken = () => localStorage.getItem("token");

//   // // Generate next 14 days (excluding past dates)
//   // const today = startOfDay(new Date());
//   // const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));

//   useEffect(() => {
//     if (selectedDate) {
//       loadAvailableSlots();
//     }
//   }, [selectedDate]);

//   const loadAvailableSlots = async () => {
//     setLoadingSlots(true);
//     setSelectedSlot(null);
//     try {
//       const dateStr = format(selectedDate, "yyyy-MM-dd");
//       const response = await fetch(
//         `${API_URL}/bookings/available-slots/${service.id}?date=${dateStr}`,
//         {
//           headers: {
//             Authorization: `Bearer ${getToken()}`,
//           },
//         }
//       );

//       if (!response.ok) throw new Error("Failed to load slots");

//       const data = await response.json();
//       setAvailableSlots(data.slots || []);
//     } catch (error) {
//       console.error("Error loading slots:", error);
//       setAvailableSlots([]);
//     } finally {
//       setLoadingSlots(false);
//     }
//   };

//   const handleBooking = async () => {
//     if (!selectedSlot) return;

//     setLoading(true);
//     try {
//       // Lock the slot first
//       const lockResponse = await fetch(`${API_URL}/bookings/lock-slot`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${getToken()}`,
//         },
//         body: JSON.stringify({
//           service_id: service.id,
//           start_time: selectedSlot.start,
//         }),
//       });

//       if (!lockResponse.ok) throw new Error("Failed to lock slot");

//       // Create booking
//       const bookingResponse = await fetch(`${API_URL}/bookings/create`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${getToken()}`,
//         },
//         body: JSON.stringify({
//           service_id: service.id,
//           start_time: selectedSlot.start,
//           duration_minutes: duration,
//           notes: notes || undefined,
//         }),
//       });

//       if (!bookingResponse.ok) throw new Error("Failed to create booking");

//       const data = await bookingResponse.json();
//       setBookingDetails(data.booking);
//       setBookingSuccess(true);

//       if (onBookingComplete) {
//         onBookingComplete(data.booking);
//       }
//     } catch (error) {
//       console.error("Error creating booking:", error);
//       alert(error.message || "Failed to create booking");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Success Screen
//   if (bookingSuccess && bookingDetails) {
//     return (
//       <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
//         <div className="text-center mb-6">
//           <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
//             <CheckCircle className="text-white" size={40} />
//           </div>
//           <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
//             Booking Confirmed!
//           </h2>
//           <p className="text-gray-600 dark:text-gray-400">
//             Your appointment has been successfully scheduled
//           </p>
//         </div>

//         <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 space-y-4 border-2 border-purple-200 dark:border-purple-700">
//           <div className="flex items-center gap-4">
//             <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
//               <Calendar
//                 className="text-purple-600 dark:text-purple-400"
//                 size={24}
//               />
//             </div>
//             <div className="flex-1">
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Service
//               </p>
//               <p className="font-bold text-lg">{service.title}</p>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div className="flex items-center gap-3">
//               <Clock className="text-blue-500" size={20} />
//               <div>
//                 <p className="text-xs text-gray-500">Date & Time</p>
//                 <p className="font-semibold text-sm">
//                   {format(parseISO(bookingDetails.start_time), "MMM d, yyyy")}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   {format(parseISO(bookingDetails.start_time), "h:mm a")}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <DollarSign className="text-green-500" size={20} />
//               <div>
//                 <p className="text-xs text-gray-500">Price</p>
//                 <p className="font-bold text-lg text-green-600">
//                   ${bookingDetails.price}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <User className="text-gray-500" size={20} />
//             <div>
//               <p className="text-xs text-gray-500">Provider</p>
//               <p className="font-semibold">{bookingDetails.provider_name}</p>
//             </div>
//           </div>

//           {bookingDetails.meeting_link && (
//             <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
//               <a
//                 href={bookingDetails.meeting_link}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
//               >
//                 🎥 Join Meeting
//               </a>
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => (window.location.href = "/buyer-dashboard")}
//           className="w-full mt-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
//         >
//           View My Bookings
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto space-y-6">
//       {/* Header */}
//       <div className="text-center mb-8">
//         <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
//           Book Your Appointment
//         </h2>
//         <p className="text-gray-600 dark:text-gray-400 text-lg">
//           Select a date and time for{" "}
//           <span className="font-semibold">{service.title}</span>
//         </p>
//         <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-3 rounded-full border-2 border-green-200 dark:border-green-700">
//           <DollarSign className="text-green-600" size={24} />
//           <span className="text-2xl font-bold text-green-600">
//             ${service.price}
//           </span>
//           <span className="text-gray-500">/ session</span>
//         </div>
//       </div>

//       {/* Date Selection */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
//         <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
//           <Calendar size={24} className="text-purple-600" />
//           Select Date
//         </h3>
//         <div className="grid grid-cols-7 gap-3">
//           {dates.map((date) => {
//             const isSelected =
//               selectedDate &&
//               format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
//             const isToday =
//               format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

//             return (
//               <button
//                 key={date.toISOString()}
//                 onClick={() => setSelectedDate(date)}
//                 className={`
//                   p-4 rounded-xl border-2 transition-all text-center hover:scale-105
//                   ${
//                     isSelected
//                       ? "border-purple-600 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 shadow-lg"
//                       : "border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
//                   }
//                   ${isToday ? "ring-2 ring-blue-400 ring-offset-2" : ""}
//                 `}
//               >
//                 <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
//                   {format(date, "EEE")}
//                 </div>
//                 <div className="text-2xl font-bold my-1">
//                   {format(date, "d")}
//                 </div>
//                 <div className="text-xs text-gray-500 dark:text-gray-400">
//                   {format(date, "MMM")}
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* Time Slots */}
//       {selectedDate && (
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
//           <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
//             <Clock size={24} className="text-blue-600" />
//             Available Time Slots
//           </h3>

//           {loadingSlots ? (
//             <div className="text-center py-16">
//               <Loader2
//                 className="animate-spin mx-auto mb-4 text-purple-600"
//                 size={48}
//               />
//               <p className="text-gray-600 dark:text-gray-400 text-lg">
//                 Loading available slots...
//               </p>
//             </div>
//           ) : availableSlots.filter((s) => s.available).length === 0 ? (
//             <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl">
//               <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
//               <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">
//                 No available slots for this date
//               </p>
//               <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
//                 Please select another date
//               </p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
//               {availableSlots
//                 .filter((slot) => slot.available)
//                 .map((slot, idx) => {
//                   const slotTime = parseISO(slot.start);
//                   const isSelected =
//                     selectedSlot && selectedSlot.start === slot.start;

//                   return (
//                     <button
//                       key={idx}
//                       onClick={() => setSelectedSlot(slot)}
//                       className={`
//                         p-4 rounded-xl border-2 transition-all font-semibold text-center hover:scale-105
//                         ${
//                           isSelected
//                             ? "border-purple-600 bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg"
//                             : "border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
//                         }
//                       `}
//                     >
//                       {format(slotTime, "h:mm a")}
//                     </button>
//                   );
//                 })}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Duration & Notes */}
//       {selectedSlot && (
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
//           <div>
//             <label className="font-semibold mb-2 block text-lg">
//               Session Duration
//             </label>
//             <select
//               value={duration}
//               onChange={(e) => setDuration(parseInt(e.target.value))}
//               className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 font-medium"
//             >
//               <option value={30}>30 minutes - ${service.price}</option>
//               <option value={60}>
//                 60 minutes - ${(service.price * 2).toFixed(2)}
//               </option>
//               <option value={90}>
//                 90 minutes - ${(service.price * 3).toFixed(2)}
//               </option>
//             </select>
//           </div>

//           <div>
//             <label className="font-semibold mb-2 block text-lg">
//               Additional Notes (Optional)
//             </label>
//             <textarea
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)}
//               placeholder="Any special requirements or notes for the provider..."
//               rows={4}
//               className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900"
//             />
//           </div>
//         </div>
//       )}

//       {/* Confirm Button */}
//       {selectedSlot && (
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
//           <button
//             onClick={handleBooking}
//             disabled={loading}
//             className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="animate-spin" size={24} />
//                 Creating Booking...
//               </>
//             ) : (
//               <>
//                 <CheckCircle size={24} />
//                 Confirm Booking - $
//                 {(service.price * (duration / 30)).toFixed(2)}
//               </>
//             )}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BookingCalendar;
