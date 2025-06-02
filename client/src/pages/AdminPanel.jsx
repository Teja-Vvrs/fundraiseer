import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../utils/api';
import { toast } from 'react-toastify';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AdminPanel = ({ defaultTab = 'campaigns' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moderationLoading, setModerationLoading] = useState({});
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', name: '' });
  const [adminCreationError, setAdminCreationError] = useState('');
  const [adminCreationSuccess, setAdminCreationSuccess] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');

  // Load initial data based on the defaultTab
  useEffect(() => {
    console.log('Initial load with defaultTab:', defaultTab);
    const loadInitialData = async () => {
      await Promise.all([fetchCampaigns(), fetchUsers()]);
    };
    loadInitialData();
  }, [defaultTab]);

  // Handle tab changes
  useEffect(() => {
    console.log('Tab changed to:', activeTab);
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
    if (activeTab === 'campaigns') {
          await fetchCampaigns();
    } else if (activeTab === 'users') {
          await fetchUsers();
        }
      } catch (err) {
        console.error('Error loading data for tab:', activeTab, err);
      }
    };
    loadData();
  }, [activeTab]);

  const fetchCampaigns = async () => {
    console.log('Fetching campaigns...');
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAllCampaigns();
      console.log('Campaigns data:', response?.data);
      
      if (!response?.data) {
        throw new Error('No data received from server');
      }
      
      const campaignsData = Array.isArray(response.data) ? response.data : 
                           Array.isArray(response.data.campaigns) ? response.data.campaigns : [];
      
      console.log('Processed campaigns data:', campaignsData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Failed to load campaigns');
      setCampaigns([]);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    console.log('Fetching users...');
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getUsers();
      console.log('Users data:', response?.data);
      
      if (!response?.data) {
        throw new Error('No data received from server');
      }
      
      const usersData = Array.isArray(response.data) ? response.data :
                       Array.isArray(response.data.users) ? response.data.users : [];
      
      console.log('Processed users data:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
      setUsers([]);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (campaignId, status) => {
    try {
    setModerationLoading(prev => ({ ...prev, [campaignId]: true }));
      console.log('Attempting to moderate campaign:', { campaignId, status });
      
      const response = await adminAPI.moderateCampaign(campaignId, status);
      console.log('Moderation successful:', response);

      // Update the campaign status in the local state
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign._id === campaignId 
            ? { ...campaign, status } 
            : campaign
        )
      );
      
      toast.success(`Campaign ${status} successfully`);
    } catch (err) {
      console.error('Moderation error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to moderate campaign';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setModerationLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCampaigns = Array.isArray(campaigns) ? campaigns.filter(campaign => 
    campaignFilter === 'all' ? true : campaign.status === campaignFilter
  ) : [];

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminCreationError('');
    setAdminCreationSuccess('');

    try {
      await adminAPI.createAdmin(newAdmin);
      setAdminCreationSuccess('Admin user created successfully');
      setNewAdmin({ email: '', password: '', name: '' });
      fetchUsers();
      toast.success('Admin user created successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create admin user';
      setAdminCreationError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    console.log('Attempting to update user role:', { userId, newRole });
    try {
      setLoading(true);
      setError('');

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const isCurrentUser = currentUser._id?.toString() === userId?.toString();

      // Prevent self-demotion
      if (isCurrentUser && newRole === 'user') {
        toast.error('You cannot demote yourself from admin');
        return;
      }

      const response = await adminAPI.updateUserRole(userId, newRole);
      
      // Update the user in the local state
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));

      // Show appropriate success message
      if (newRole === 'admin') {
        toast.success('User has been promoted to admin. They will need to log in again to access admin features.');
      } else {
        toast.success(`User role has been updated to ${newRole}`);
      }

      // If current user's role was changed, the API will handle the redirect
      if (!isCurrentUser) {
        // Refresh the users list only if we're not being redirected
        await fetchUsers();
      }
      
    } catch (err) {
      console.error('Failed to update user role:', {
        error: err,
        userId,
        newRole
      });
      
      const errorMessage = err.message || err.response?.data?.message || 'Failed to update user role';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Refresh users list to ensure UI is in sync
      await fetchUsers();
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    {
      name: 'Campaigns',
      icon: ChartBarIcon,
      tab: 'campaigns',
      count: campaigns.length
    },
    {
      name: 'Users',
      icon: UserGroupIcon,
      tab: 'users',
      count: users.length
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Manage campaigns, users, and communications</p>
        </div>

        {/* Main Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <nav className="flex space-x-4 p-4" aria-label="Tabs">
            {navigationItems.map((item) => (
            <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === item.tab
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5 mr-2" />
                <span>{item.name}</span>
                {item.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === item.tab
                      ? 'bg-indigo-200 text-indigo-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.count}
                  </span>
                )}
            </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Campaign Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCampaignFilter('all')}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      campaignFilter === 'all'
                        ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  All Campaigns
                  </button>
                  <button
                    onClick={() => setCampaignFilter('pending')}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      campaignFilter === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                    Pending
                  </button>
                  <button
                    onClick={() => setCampaignFilter('approved')}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      campaignFilter === 'approved'
                        ? 'bg-green-100 text-green-800'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Approved
                  </button>
                  <button
                    onClick={() => setCampaignFilter('rejected')}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      campaignFilter === 'rejected'
                        ? 'bg-red-100 text-red-800'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                    Rejected
                  </button>
              </div>
            </div>

            {/* Campaigns List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {filteredCampaigns.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
                  <p className="mt-1 text-sm text-gray-500">
                No {campaignFilter !== 'all' ? campaignFilter : ''} campaigns to display.
                  </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                    <div key={campaign._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                            {campaign.title}
                          </h3>
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(campaign.status)}`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </div>
                          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                            <p>Created by: {campaign.creator?.name || campaign.creator?.email || 'Unknown'}</p>
                            <p>Goal: ${campaign.goalAmount?.toLocaleString() || '0'}</p>
                        </div>
                          <p className="mt-2 text-sm text-gray-600">{campaign.description}</p>
                        {campaign.mediaUrls?.[0] && (
                          <img
                            src={campaign.mediaUrls[0]}
                            alt={campaign.title}
                              className="mt-4 w-full max-w-2xl h-40 object-cover rounded-lg"
                            loading="lazy"
                          />
                        )}
                      </div>
                      {campaign.status === 'pending' && (
                          <div className="flex sm:flex-col gap-2">
                          <button
                            onClick={() => handleModeration(campaign._id, 'approved')}
                            disabled={moderationLoading[campaign._id]}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleModeration(campaign._id, 'rejected')}
                            disabled={moderationLoading[campaign._id]}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Create Admin Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Admin User</h2>
              {adminCreationError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {adminCreationError}
                </div>
              )}
              {adminCreationSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                  {adminCreationSuccess}
                </div>
              )}
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                <button
                  type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Admin
                </button>
                </div>
              </form>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Users</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel; 