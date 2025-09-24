import React, { useState, useEffect } from 'react';
import { supabase, AlumniProfile } from '../lib/supabase';
import { 
  Search, 
  Filter, 
  User, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Award,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SearchPage: React.FC = () => {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    cohort_year: '',
    program: '',
    location: '',
    profession: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, profiles]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_profiles')
        .select('*')
        .eq('is_approved', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...profiles];

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.full_name.toLowerCase().includes(term) ||
        profile.current_profession?.toLowerCase().includes(term) ||
        profile.current_organization?.toLowerCase().includes(term) ||
        profile.program.toLowerCase().includes(term) ||
        profile.skills.some(skill => skill.toLowerCase().includes(term)) ||
        profile.interests.some(interest => interest.toLowerCase().includes(term))
      );
    }

    // Cohort year filter
    if (filters.cohort_year) {
      filtered = filtered.filter(profile => 
        profile.cohort_year.toString() === filters.cohort_year
      );
    }

    // Program filter
    if (filters.program) {
      filtered = filtered.filter(profile => 
        profile.program.toLowerCase().includes(filters.program.toLowerCase())
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(profile => 
        profile.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Profession filter
    if (filters.profession) {
      filtered = filtered.filter(profile => 
        profile.current_profession?.toLowerCase().includes(filters.profession.toLowerCase())
      );
    }

    setFilteredProfiles(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      cohort_year: '',
      program: '',
      location: '',
      profession: ''
    });
    setSearchTerm('');
  };

  const trackProfileView = async (profileId: string) => {
    try {
      await supabase.from('profile_views').insert({
        profile_id: profileId,
        viewer_ip: null, // Would be set by a backend function in production
      });

      // Update profile views count
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        await supabase
          .from('alumni_profiles')
          .update({ profile_views: profile.profile_views + 1 })
          .eq('id', profileId);
      }
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Alumni</h1>
          <p className="text-gray-600 mt-2">Connect with fellow alumni from the exchange programs</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, profession, skills, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filters</span>
            </button>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{filteredProfiles.length} of {profiles.length} alumni</span>
              {(searchTerm || Object.values(filters).some(v => v)) && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cohort Year
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2020"
                    value={filters.cohort_year}
                    onChange={(e) => handleFilterChange('cohort_year', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Fulbright"
                    value={filters.program}
                    onChange={(e) => handleFilterChange('program', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., New York"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profession
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Engineer"
                    value={filters.profession}
                    onChange={(e) => handleFilterChange('profession', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Alumni Found</h3>
            <p className="text-gray-600">
              {searchTerm || Object.values(filters).some(v => v)
                ? "Try adjusting your search criteria or filters"
                : "No approved alumni profiles are currently available"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4 mb-4">
                  {profile.profile_photo_url ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={profile.profile_photo_url}
                      alt={profile.full_name}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {profile.full_name}
                    </h3>
                    {profile.current_profession && (
                      <p className="text-gray-600 truncate">{profile.current_profession}</p>
                    )}
                    {profile.current_organization && (
                      <p className="text-gray-500 text-sm truncate">{profile.current_organization}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Cohort {profile.cohort_year}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    <span className="truncate">{profile.program}</span>
                  </div>
                  {profile.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Eye className="h-4 w-4 mr-2" />
                    <span>{profile.profile_views} views</span>
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {profile.bio}
                  </p>
                )}

                {profile.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {profile.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {profile.skills.length > 3 && (
                        <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                          +{profile.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Link
                    to={`/profile/${profile.id}`}
                    onClick={() => trackProfileView(profile.id)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;