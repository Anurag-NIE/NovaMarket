// frontend/src/components/AnalyticsDashboard.jsx - NEW FILE
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Lightbulb,
} from "lucide-react";
import api from "../utils/api";

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [clientInsights, setClientInsights] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    loadAllData();
  }, [timeRange]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, clientsRes, recsRes, forecastRes] =
        await Promise.all([
          api.get(`/analytics/provider?days=${timeRange}`),
          api.get("/analytics/client-insights"),
          api.get("/analytics/recommendations"),
          api.get("/analytics/demand-forecast?days_ahead=7"),
        ]);

      setAnalytics(analyticsRes.data);
      setClientInsights(clientsRes.data);
      setRecommendations(recsRes.data.recommendations);
      setForecast(forecastRes.data.forecast);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, daily_stats, service_performance, peak_hours } = analytics;

  // Colors
  const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6"];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track your performance and insights
          </p>
        </div>

        {/* Time Range Selector */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<Calendar className="w-6 h-6" />}
          title="Total Bookings"
          value={summary.total_bookings}
          change={summary.booking_growth}
          color="purple"
        />
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Revenue"
          value={`$${summary.total_revenue.toFixed(2)}`}
          change={summary.revenue_growth}
          color="green"
        />
        <MetricCard
          icon={<CheckCircle className="w-6 h-6" />}
          title="Completion Rate"
          value={`${(
            (summary.completed_bookings / summary.total_bookings) *
            100
          ).toFixed(1)}%`}
          color="blue"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Avg Booking Value"
          value={`$${summary.avg_booking_value.toFixed(2)}`}
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={daily_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) =>
                  new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis />
              <Tooltip
                formatter={(value) => `$${value}`}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: "#8B5CF6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings by Day */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={daily_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) =>
                  new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Bar dataKey="bookings" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing Services</h3>
        <div className="space-y-4">
          {service_performance.slice(0, 5).map((service, index) => (
            <div
              key={service.service_id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                #{index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{service.title}</h4>
                <p className="text-sm text-gray-600">
                  {service.total_bookings} bookings · ⭐{" "}
                  {service.avg_rating.toFixed(1)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-purple-600">
                  ${service.revenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Peak Booking Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peak_hours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
              <YAxis />
              <Tooltip
                labelFormatter={(hour) => `${hour}:00`}
                formatter={(value) => [`${value} bookings`, "Bookings"]}
              />
              <Bar dataKey="bookings" fill="#EC4899" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Client Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Client Insights</h3>
          {clientInsights && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Clients</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {clientInsights.total_clients}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Repeat Clients</p>
                  <p className="text-3xl font-bold text-green-600">
                    {clientInsights.repeat_clients}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Retention Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {clientInsights.retention_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">VIP Clients</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {clientInsights.vip_clients}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demand Forecast */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          7-Day Demand Forecast
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day_name" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="predicted_bookings"
              fill="#10B981"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6 border-2 border-purple-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          AI-Powered Recommendations
        </h3>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`
                p-4 rounded-lg border-l-4 bg-white
                ${
                  rec.priority === "high"
                    ? "border-red-500"
                    : rec.priority === "medium"
                    ? "border-yellow-500"
                    : "border-blue-500"
                }
              `}
            >
              <div className="flex items-start gap-3">
                {rec.priority === "high" ? (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {rec.description}
                  </p>
                </div>
                <span
                  className={`
                  text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0
                  ${
                    rec.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : rec.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }
                `}
                >
                  {rec.priority.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, title, value, change, color }) => {
  const colors = {
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    green: "bg-green-50 text-green-600 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  return (
    <div className={`${colors[color]} border-2 rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white rounded-lg">{icon}</div>
        {change !== undefined && (
          <span
            className={`text-sm font-semibold ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default AnalyticsDashboard;
