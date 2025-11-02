import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Clock, Check, X } from "lucide-react";
import { toast } from "sonner";
import api from "../utils/api";


// 🕒 Validate slot times (no overlaps & logical order)
const validateTimeSlot = (slot, existingSlots) => {
  const [startHour, startMin] = slot.start.split(':').map(Number);
  const [endHour, endMin] = slot.end.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // End time must be after start
  if (endTime <= startTime) {
    return { valid: false, error: 'End time must be after start time' };
  }

  // Overlap detection
  for (const existing of existingSlots) {
    const [existStartHour, existStartMin] = existing.start.split(':').map(Number);
    const [existEndHour, existEndMin] = existing.end.split(':').map(Number);

    const existStartTime = existStartHour * 60 + existStartMin;
    const existEndTime = existEndHour * 60 + existEndMin;

    if (startTime < existEndTime && endTime > existStartTime) {
      return { valid: false, error: 'This slot overlaps with another slot' };
    }
  }

  return { valid: true };
};




const AvailabilitySettings = ({ serviceId, serviceName }) => {
  const [availability, setAvailability] = useState({
    0: { enabled: false, slots: [{ start: "09:00", end: "17:00" }] }, // Monday
    1: { enabled: false, slots: [{ start: "09:00", end: "17:00" }] },
    2: { enabled: false, slots: [{ start: "09:00", end: "17:00" }] },
    3: { enabled: false, slots: [{ start: "09:00", end: "17:00" }] },
    4: { enabled: false, slots: [{ start: "09:00", end: "17:00" }] },
    5: { enabled: false, slots: [{ start: "09:00", end: "17:00" }] }, // Saturday
    6: { enabled: false, slots: [{ start: "09:00", end: "17:00" }] }, // Sunday
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    fetchAvailability();
  }, [serviceId]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/availability/${serviceId}`);
      const data = response.data;

      // Convert API data to component state
      const newAvailability = { ...availability };
      data.forEach((avail) => {
        newAvailability[avail.day_of_week] = {
          enabled: true,
          slots: avail.time_slots,
        };
      });
      setAvailability(newAvailability);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex) => {
    setAvailability({
      ...availability,
      [dayIndex]: {
        ...availability[dayIndex],
        enabled: !availability[dayIndex].enabled,
      },
    });
  };

  const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
    const newSlots = [...availability[dayIndex].slots];
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      [field]: value,
    };
    setAvailability({
      ...availability,
      [dayIndex]: {
        ...availability[dayIndex],
        slots: newSlots,
      },
    });
  };

  const addTimeSlot = (dayIndex) => {
    setAvailability({
      ...availability,
      [dayIndex]: {
        ...availability[dayIndex],
        slots: [
          ...availability[dayIndex].slots,
          { start: "09:00", end: "17:00" },
        ],
      },
    });
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    const newSlots = availability[dayIndex].slots.filter(
      (_, i) => i !== slotIndex
    );
    setAvailability({
      ...availability,
      [dayIndex]: {
        ...availability[dayIndex],
        slots:
          newSlots.length > 0 ? newSlots : [{ start: "09:00", end: "17:00" }],
      },
    });
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      for (const [dayIndex, dayData] of Object.entries(availability)) {
        if (dayData.enabled) {
          for (const slot of dayData.slots) {
            const validation = validateTimeSlot(
              slot,
              dayData.slots.filter((s) => s !== slot)
            );
            if (!validation.valid) {
              toast.error(`${days[dayIndex]}: ${validation.error}`);
              setSaving(false);
              return;
            }
          }

          await api.post("/availability", {
            service_id: serviceId,
            day_of_week: parseInt(dayIndex),
            time_slots: dayData.slots,
          });
        }
      }

      toast.success("Availability updated successfully!");
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Set your weekly availability for <strong>{serviceName}</strong>
      </p>

      <div className="space-y-4">
        {days.map((day, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDay(index)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      availability[index].enabled
                        ? "bg-purple-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        availability[index].enabled ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                  <span className="font-semibold">{day}</span>
                </div>
                {availability[index].enabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeSlot(index)}
                  >
                    + Add Slot
                  </Button>
                )}
              </div>
            </CardHeader>
            {availability[index].enabled && (
              <CardContent className="space-y-2">
                {availability[index].slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) =>
                        updateTimeSlot(
                          index,
                          slotIndex,
                          "start",
                          e.target.value
                        )
                      }
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) =>
                        updateTimeSlot(index, slotIndex, "end", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                    {availability[index].slots.length > 1 && (
                      <button
                        onClick={() => removeTimeSlot(index, slotIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={saveAvailability} disabled={saving} className="flex-1">
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Check size={16} className="mr-2" />
              Save Availability
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AvailabilitySettings;
