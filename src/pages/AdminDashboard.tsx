import React, { useState, useEffect } from 'react';
import { supabase, AlumniProfile } from '../lib/supabase';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Calendar,
  MapPin,
  Briefcase,
  Award,
  Eye,
  Share2,
  Check,
  X,
  Search,
  Filter,
  Download
} from 'lucide-react';

interface AdminStats {
  totalAlumni: number;
  pendingApprovals: number;
  totalViews: number;
  totalShares: number;
  approvedThisMonth: number;
  topCohorts: Array<{ cohort_year: number; count: number }>;
  topPrograms: Array<{ program: string; count: number }>;
}

const AdminDashboard: React.FC = () => {
  const [pendingProfiles, setPendingProfiles] = useState<AlumniProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<AlumniProfile[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalAlumni: 0,
    pendingApprovals: 0,
    totalViews: 0,
    totalShares: 0,
    approvedThisMonth: 0,
    topCohorts: [],
    topPrograms: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'manage'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProfiles, setFilteredProfiles] = useState<AlumniProfile[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'manage') {
      applySearchFilter();
    }
  }, [searchTerm, allProfiles, activeTab]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadPendingProfiles(),
        loadAllProfiles(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingProfiles = async () => {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    setPendingProfiles(data || []);
  };

  const loadAllProfiles = async () => {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAllProfiles(data || []);
  };

  const loadStats = async () => {
    // Get total counts
    const { data: totalData } = await supabase
      .from('alumni_profiles')
      .select('id, profile_views, profile_shares, is_approved, created_at, cohort_year, program');

    if (!totalData) return;

    const totalAlumni = totalData.filter(p => p.is_approved).length;
    const pendingApprovals = totalData.filter(p => !p.is_approved).length;
    const totalViews = totalData.reduce((sum, p) => sum + p.profile_views, 0);
    const totalShares = totalData.reduce((sum, p) => sum + p.profile_shares, 0);

    // Approved this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const approvedThisMonth = totalData.filter(p => {
      const createdDate = new Date(p.created_at);
      return p.is_approved && 
             createdDate.getMonth() === currentMonth && 
             createdDate.getFullYear() === currentYear;
    }).length;

    // Top cohorts
    const cohortCounts = totalData.reduce((acc: Record<number, number>, p) => {
      if (p.is_approved) {
        acc[p.cohort_year] = (acc[p.cohort_year] || 0) + 1;
      }
      return acc;
    }, {});

    const topCohorts = Object.entries(cohortCounts)
      .map(([year, count]) => ({ cohort_year: parseInt(year), count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top programs
    const programCounts = totalData.reduce((acc: Record<string, number>, p) => {
      if (p.is_approved) {
        acc[p.program] = (acc[p.program] || 0) + 1;
      }
      return acc;
    }, {});

    const topPrograms = Object.entries(programCounts)
      .map(([program, count]) => ({ program, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      totalAlumni,
      pendingApprovals,
      totalViews,
      totalShares,
      approvedThisMonth,
      topCohorts,
      topPrograms
    });
  };

  const handleApproveProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('alumni_profiles')
        .update({ is_approved: true })
        .eq('id', profileId);

      if (error) throw error;
      
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error approving profile:', error);
    }
  };

  const handleRejectProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('alumni_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
      
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting profile:', error);
    }
  };

  const handleToggleProfileStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('alumni_profiles')
        .update({ is_approved: !currentStatus })
        .eq('id', profileId);

      if (error) throw error;
      
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error toggling profile status:', error);
    }
  };

  const applySearchFilter = () => {
    if (!searchTerm) {
      setFilteredProfiles(allProfiles);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = allProfiles.filter(profile =>
      profile.full_name.toLowerCase().includes(term) ||
      profile.email.toLowerCase().includes(term) ||
      profile.current_profession?.toLowerCase().includes(term) ||
      profile.program.toLowerCase().includes(term)
    );
    setFilteredProfiles(filtered);
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Cohort Year', 'Program', 'Profession', 'Organization', 'Status', 'Views', 'Shares'].join(','),
      ...allProfiles.map(profile => [
        profile.full_name,
        profile.email,
        profile.cohort_year,
        profile.program,
        profile.current_profession || '',
        profile.current_organization || '',
        profile.is_approved ? 'Approved' : 'Pending',
        profile.profile_views,
        profile.profile_shares
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alumni-profiles.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Alumni</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAlumni}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Profile Views</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Share2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Shares</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalShares}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cohorts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Cohorts</h3>
          <div className="space-y-3">
            {stats.topCohorts.map((cohort, index) => (
              <div key={cohort.cohort_year} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-900">Cohort {cohort.cohort_year}</span>
                </div>
                <span className="text-gray-600 font-medium">{cohort.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Programs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Programs</h3>
          <div className="space-y-3">
            {stats.topPrograms.map((program, index) => (
              <div key={program.program} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-900 truncate">{program.program}</span>
                </div>
                <span className="text-gray-600 font-medium">{program.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPendingApprovals = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Pending Approvals ({pendingProfiles.length})</h2>
        <p className="text-gray-600 mt-1">Review and approve new alumni registrations</p>
      </div>

      {pendingProfiles.length === 0 ? (
        <div className="p-12 text-center">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No pending approvals</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {pendingProfiles.map((profile) => (
            <div key={profile.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {profile.profile_photo_url ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={profile.profile_photo_url}
                      alt={profile.full_name}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">{profile.full_name}</h3>
                    <p className="text-gray-600">{profile.email}</p>
                    
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Cohort {profile.cohort_year}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4" />
                        <span>{profile.program}</span>
                      </div>
                      {profile.current_profession && (
                        <div className="flex items-center space-x-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{profile.current_profession}</span>
                        </div>
                      )}
                      {profile.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                    </div>

                    {profile.bio && (
                      <p className="mt-3 text-gray-700 text-sm">{profile.bio}</p>
                    )}

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        Registered: {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 ml-4">
                  <button
                    onClick={() => handleApproveProfile(profile.id)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectProfile(profile.id)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderManageProfiles = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Profiles ({allProfiles.length})</h2>
            <p className="text-gray-600 mt-1">View and manage all alumni profiles</p>
          </div>
          <button
            onClick={exportData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
        
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alumni
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Analytics
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProfiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {profile.profile_photo_url ? (
                      <img className="h-10 w-10 rounded-full object-cover" src={profile.profile_photo_url} alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{profile.full_name}</div>
                      <div className="text-sm text-gray-500">{profile.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{profile.program}</div>
                  <div className="text-sm text-gray-500">Cohort {profile.cohort_year}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    profile.is_approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-4">
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {profile.profile_views}
                    </span>
                    <span className="flex items-center">
                      <Share2 className="h-4 w-4 mr-1" />
                      {profile.profile_shares}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleToggleProfileStatus(profile.id, profile.is_approved)}
                    className={`inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-white ${
                      profile.is_approved 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {profile.is_approved ? 'Suspend' : 'Approve'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage alumni profiles and view analytics</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="h-5 w-5 inline-block mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCheck className="h-5 w-5 inline-block mr-2" />
                Pending Approvals
                {stats.pendingApprovals > 0 && (
                  <span className="ml-1 inline-flex items-center px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full">
                    {stats.pendingApprovals}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-5 w-5 inline-block mr-2" />
                Manage Profiles
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'pending' && renderPendingApprovals()}
        {activeTab === 'manage' && renderManageProfiles()}
      </div>
    </div>
  );
};

export default AdminDashboard;