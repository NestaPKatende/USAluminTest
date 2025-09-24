import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, WorkExperience } from '../lib/supabase';
import { 
  User, 
  Eye, 
  Share2, 
  Plus, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Edit, 
  Trash2,
  ExternalLink,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { profile, user } = useAuth();
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExperience, setShowAddExperience] = useState(false);

  useEffect(() => {
    if (profile) {
      loadWorkExperiences();
    }
  }, [profile]);

  const loadWorkExperiences = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('work_experiences')
        .select('*')
        .eq('alumni_id', profile.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setWorkExperiences(data || []);
    } catch (error) {
      console.error('Error loading work experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = async () => {
    if (!profile) return;

    const shareUrl = `${window.location.origin}/profile/${profile.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name} - Alumni Profile`,
          text: `Check out ${profile.full_name}'s profile on our alumni network`,
          url: shareUrl,
        });
        
        // Track share
        await supabase
          .from('alumni_profiles')
          .update({ profile_shares: profile.profile_shares + 1 })
          .eq('id', profile.id);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600">Please complete your registration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile.full_name}</h1>
          <p className="text-gray-600 mt-2">Manage your profile and connect with fellow alumni</p>
        </div>

        {/* Status Banner */}
        {!profile.is_approved && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-yellow-400">⏳</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Profile Pending Approval
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Your profile is currently under review. You'll be notified once it's approved.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {profile.profile_photo_url ? (
                    <img
                      className="h-20 w-20 rounded-full object-cover"
                      src={profile.profile_photo_url}
                      alt={profile.full_name}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                    <p className="text-gray-600">{profile.current_profession}</p>
                    <p className="text-gray-500">{profile.current_organization}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to="/profile/edit"
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={handleShareProfile}
                    className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">{profile.cohort_year}</div>
                  <div className="text-xs text-gray-500">Cohort</div>
                </div>
                <div className="text-center">
                  <Award className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">{profile.program}</div>
                  <div className="text-xs text-gray-500">Program</div>
                </div>
                <div className="text-center">
                  <Eye className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">{profile.profile_views}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <Share2 className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">{profile.profile_shares}</div>
                  <div className="text-xs text-gray-500">Shares</div>
                </div>
              </div>

              {profile.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700">{profile.bio}</p>
                </div>
              )}

              {profile.location && (
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.skills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.interests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Work Experience Section */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Work Experience</h3>
                <button
                  onClick={() => setShowAddExperience(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Experience</span>
                </button>
              </div>

              {workExperiences.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No work experience added yet.</p>
                  <button
                    onClick={() => setShowAddExperience(true)}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add your first experience
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {workExperiences.map((experience) => (
                    <div key={experience.id} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {experience.position_title}
                            </h4>
                            <p className="text-gray-700">{experience.organization_name}</p>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                              <span>
                                {new Date(experience.start_date).toLocaleDateString()} - {' '}
                                {experience.end_date 
                                  ? new Date(experience.end_date).toLocaleDateString()
                                  : 'Present'
                                }
                              </span>
                              {experience.location && (
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {experience.location}
                                </span>
                              )}
                            </div>
                            {experience.description && (
                              <p className="mt-2 text-gray-700">{experience.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button className="p-1 text-gray-400 hover:text-blue-600">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/search"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Search Alumni</span>
                  <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
                <Link
                  to={`/profile/${profile.id}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">View Public Profile</span>
                  <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
                <button
                  onClick={handleShareProfile}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                >
                  <Share2 className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Share Profile</span>
                </button>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Analytics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="text-2xl font-bold text-blue-600">{profile.profile_views}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile Shares</span>
                  <span className="text-2xl font-bold text-green-600">{profile.profile_shares}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Work Experiences</span>
                  <span className="text-2xl font-bold text-purple-600">{workExperiences.length}</span>
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Completion</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Basic Info</span>
                  <span className="text-green-600">✓ Complete</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Work Experience</span>
                  <span className={workExperiences.length > 0 ? "text-green-600" : "text-yellow-600"}>
                    {workExperiences.length > 0 ? "✓ Complete" : "⚠ Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Profile Photo</span>
                  <span className={profile.profile_photo_url ? "text-green-600" : "text-yellow-600"}>
                    {profile.profile_photo_url ? "✓ Complete" : "⚠ Missing"}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Overall Progress</span>
                  <span className="text-sm font-bold text-blue-600">85%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;