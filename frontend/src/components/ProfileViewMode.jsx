// frontend/src/components/ProfileViewMode.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Briefcase,
  DollarSign,
  Award,
  Globe,
  CheckCircle,
  MapPin,
  Edit,
} from "lucide-react";

const ProfileViewMode = ({ profile, user, userId, setIsEditing }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 mb-6 text-white shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-purple-600 text-5xl font-bold shadow-lg">
                {user?.name?.[0]?.toUpperCase() ||
                  profile.title?.[0]?.toUpperCase() ||
                  "F"}
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {user?.name || "Freelancer"}
                </h1>
                <p className="text-2xl opacity-90 mb-3">{profile.title}</p>
                <div className="flex items-center gap-4 flex-wrap">
                  {profile.location && (
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                      <MapPin size={16} />
                      {profile.location}
                    </span>
                  )}
                  <span
                    className={`px-4 py-1 rounded-full text-sm font-semibold ${
                      profile.availability === "available"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  >
                    {profile.availability === "available"
                      ? "Available for work"
                      : "Currently busy"}
                  </span>
                </div>
              </div>
            </div>

            {!userId && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                <Edit size={18} className="mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Hourly Rate */}
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="text-green-600" size={24} />
                  <h3 className="font-bold text-xl">Hourly Rate</h3>
                </div>
                <p className="text-4xl font-bold text-green-600">
                  ${profile.hourly_rate}
                  <span className="text-lg text-gray-600">/hr</span>
                </p>
              </CardContent>
            </Card>

            {/* Experience */}
            {profile.experience_years > 0 && (
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="text-blue-600" size={24} />
                    <h3 className="font-bold text-xl">Experience</h3>
                  </div>
                  <p className="text-3xl font-bold">
                    {profile.experience_years}{" "}
                    {profile.experience_years === 1 ? "year" : "years"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-xl mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            {profile.categories && profile.categories.length > 0 && (
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-xl mb-4">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.categories.map((category, idx) => (
                      <Badge
                        key={idx}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-xl mb-4">Languages</h3>
                  <div className="space-y-2">
                    {profile.languages.map((lang, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Globe size={16} className="text-gray-500" />
                        <span>{lang}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Website & Portfolio URL */}
            {(profile.website || profile.portfolio_url) && (
              <Card className="shadow-lg">
                <CardContent className="pt-6 space-y-3">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      <Globe size={18} />
                      Visit Website
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Briefcase size={18} />
                      View Portfolio
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="border-l-4 border-purple-600 pl-4 py-2"
                      >
                        <p className="font-semibold text-lg">{edu.degree}</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {edu.institution}
                        </p>
                        {edu.year && (
                          <p className="text-sm text-gray-500">{edu.year}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
                      >
                        <CheckCircle
                          className="text-green-600 flex-shrink-0 mt-1"
                          size={20}
                        />
                        <div>
                          <p className="font-semibold">{cert.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cert.issuer}
                          </p>
                          {cert.year && (
                            <p className="text-xs text-gray-500">{cert.year}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Projects */}
            {profile.portfolio && profile.portfolio.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Portfolio Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.portfolio.map((item, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-lg mb-2">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {item.description}
                          </p>
                          {item.project_url && (
                            <a
                              href={item.project_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium inline-flex items-center gap-1"
                            >
                              View Project →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileViewMode;
