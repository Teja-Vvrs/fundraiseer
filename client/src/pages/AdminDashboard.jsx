import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    campaigns: { total: 0, pending: 0, approved: 0 },
    users: { total: 0, admins: 0 },
    donations: { amount: 0, count: 0 }
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, campaignsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getRecentCampaigns()
      ]);

      console.log('Dashboard stats:', statsRes.data);
      console.log('Recent campaigns:', campaignsRes.data);

      setStats(statsRes.data || {
        campaigns: { total: 0, pending: 0, approved: 0 },
        users: { total: 0, admins: 0 },
        donations: { amount: 0, count: 0 }
      });

      setRecentCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats_items = [
    {
      name: 'Total Campaigns',
      value: stats.campaigns?.total || 0,
      subValue: `${stats.campaigns?.pending || 0} pending`,
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      link: '/admin/campaigns'
    },
    {
      name: 'Active Users',
      value: stats.users?.total || 0,
      subValue: `${stats.users?.admins || 0} admins`,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      link: '/admin/users'
    },
    {
      name: 'Total Donations',
      value: (stats.donations?.amount || 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      }),
      subValue: `${stats.donations?.count || 0} donations`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      link: '/admin/campaigns'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Admin Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats_items.map((item) => (
          <Link
            key={item.name}
            to={item.link}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${item.color}`}>
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </div>
                    </dd>
                    <dd className="text-sm text-gray-500">{item.subValue}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Campaigns */}
      <div className="mt-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Campaigns
              </h3>
              <Link
                to="/admin/campaigns"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentCampaigns.length > 0 ? (
                recentCampaigns.map((campaign) => (
                  <div
                    key={campaign._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {campaign.title}
                        </p>
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                            campaign.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : campaign.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <p className="truncate">
                          by {campaign.creatorId?.name || campaign.creatorId?.email || 'Unknown'}
                        </p>
                        <span className="mx-2">•</span>
                        <p>Goal: ${campaign.goalAmount?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                    <Link
                      to={`/campaigns/${campaign._id}`}
                      className="ml-4 flex-shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View details
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent campaigns to display
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 