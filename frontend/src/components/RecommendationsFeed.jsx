// frontend/src/components/RecommendationsFeed.jsx - NEW FILE
import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const RecommendationsFeed = ({ userId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personalized"); // personalized | trending
  const navigate = useNavigate();

  useEffect(() => {
    loadRecommendations();
  }, [activeTab]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      if (activeTab === "personalized") {
        const response = await api.get(
          "/recommendations/personalized?limit=12"
        );
        setRecommendations(response.data.recommendations);
      } else {
        const response = await api.get("/recommendations/trending?limit=12");
        setTrending(response.data.trending);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const ServiceCard = ({ service, matchScore, reason }) => (
    <div
      onClick={() => navigate(`/listing/${service.service_id || service.id}`)}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            service.image || service.images?.[0] || "/api/placeholder/400/300"
          }
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {matchScore && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            {matchScore}% Match
          </div>
        )}

        {service.trending_score && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Trending
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {service.title}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            by {service.provider_name || service.seller_name}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">
              {service.rating?.toFixed(1) || "5.0"}
            </span>
          </div>
        </div>

        {reason && (
          <div className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full inline-block mb-2">
            {reason}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-2xl font-bold text-purple-600">
            ${service.price}
          </span>
          <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
            View Details
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {service.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {activeTab === "personalized" ? (
              <>
                <Sparkles className="w-6 h-6 text-purple-600" />
                Recommended for You
              </>
            ) : (
              <>
                <TrendingUp className="w-6 h-6 text-orange-500" />
                Trending Services
              </>
            )}
          </h2>
          <p className="text-gray-600 mt-1">
            {activeTab === "personalized"
              ? "AI-powered personalized recommendations based on your preferences"
              : "Most popular services right now"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("personalized")}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all
              ${
                activeTab === "personalized"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }
            `}
          >
            For You
          </button>
          <button
            onClick={() => setActiveTab("trending")}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all
              ${
                activeTab === "trending"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }
            `}
          >
            Trending
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeTab === "personalized" ? (
              recommendations.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    No recommendations yet
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Browse services and book to get personalized recommendations
                  </p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <ServiceCard
                    key={rec.service_id}
                    service={rec}
                    matchScore={rec.match_score}
                    reason={rec.reason}
                  />
                ))
              )
            ) : trending.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  No trending services yet
                </p>
              </div>
            ) : (
              trending.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>

          {/* Call to Action */}
          {activeTab === "personalized" && recommendations.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={loadRecommendations}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Refresh Recommendations
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendationsFeed;
