import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, AlumniProfile, WorkExperience } from '../lib/supabase';
import { 
  User, 
  MapPin, 
  Calendar, 
  Award, 
  Briefcase, 
  Mail, 
  Phone,
  Share2,
  ExternalLink,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicProfilePage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profileId) {
      loadProfile();
      loadWorkExperiences();
      trackProfileView();
    }
  }, [profileId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('is_approved', true)
        .eq('is_public', true)
        .single();

      if (error) {
        setError('Profile not found or not accessible');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('work_experiences')
        .select('*')
        .eq('alumni_id', profileId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setWorkExperiences(data || []);
    } catch (error) {
      console.error('Error loading work experiences:', error);
    }
  };

  const trackProfileView = async () => {
    try {
      await supabase.from('profile_views').insert({
        profile_id: profileId,
        viewer_ip: null, // Would be set by a backend function in production
      });

      // Update profile views count
      const { data: profileData } = await supabase
        .from('alumni_profiles')
        .select('profile_views')
        .eq('id', profileId)
        .single();

      if (profileData) {
        await supabase
          .from('alumni_profiles')
          .update({ profile_views: profileData.profile_views + 1 })
          .eq('id', profileId);
      }
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share && profile) {
      try {
        await navigator.share({
          title: `${profile.full_name} - Alumni Profile`,
          text: `Check out ${profile.full_name}'s profile on the US-Uganda Alumni Exchange network`,
          url: shareUrl,
        });
        
        // Track share
        if (profile) {
          await supabase
            .from('alumni_profiles')
            .update({ profile_shares: profile.profile_shares + 1 })
            .eq('id', profile.id);
        }
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

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "This profile doesn't exist or is not publicly accessible."}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Search</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/search"
              className="inline-flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Search</span>
            </Link>
            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Profile</span>
            </button>
          </div>

          <div className="flex items-center space-x-6">
            {profile.profile_photo_url ? (
              <img
                className="h-32 w-32 rounded-full object-cover border-4 border-white/20"
                src={profile.profile_photo_url}
                alt={profile.full_name}
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/20">
                <User className="h-16 w-16 text-white/80" />
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{profile.full_name}</h1>
              {profile.current_profession && (
                <p className="text-xl text-blue-100 mb-2">{profile.current_profession}</p>
              )}
              {profile.current_organization && (
                <p className="text-blue-100 mb-4">{profile.current_organization}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-blue-100">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Cohort {profile.cohort_year}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4" />
                  <span>{profile.program}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{profile.profile_views} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            {profile.bio && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 text-lg leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Work Experience Section */}
            {workExperiences.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Work Experience</h2>
                <div className="space-y-6">
                  {workExperiences.map((experience) => (
                    <div key={experience.id} className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {experience.position_title}
                        </h3>
                        <p className="text-gray-700 text-lg">{experience.organization_name}</p>
                        <div className="flex items-center space-x-4 mt-2 text-gray-600">
                          <span>
                            {new Date(experience.start_date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })} - {' '}
                            {experience.end_date 
                              ? new Date(experience.end_date).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })
                              : 'Present'
                            }
                          </span>
                          {experience.location && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {experience.location}
                            </span>
                          )}
                        </div>
                        {experience.description && (
                          <p className="mt-3 text-gray-700">{experience.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a 
                    href={`mailto:${profile.email}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {profile.email}
                  </a>
                </div>
                {profile.phone && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a 
                      href={`tel:${profile.phone}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {profile.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {Object.keys(profile.social_links).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Social Links</h4>
                  <div className="space-y-2">
                    {Object.entries(profile.social_links).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="capitalize">{platform}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            {profile.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {profile.interests.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Program Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Program:</span>
                  <p className="font-medium text-gray-900">{profile.program}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cohort Year:</span>
                  <p className="font-medium text-gray-900">{profile.cohort_year}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;