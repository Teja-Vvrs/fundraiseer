import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  ArrowTrendingUpIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getUserDashboard();
      setDashboardData(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <path
          d={`M${cx},${cy}l${outerRadius},0`}
          fill="none"
          stroke={fill}
        />
        <path
          d={`M${cx},${cy}l${-outerRadius},0`}
          fill="none"
          stroke={fill}
        />
        <path
          d={`M${cx},${cy}l0,${outerRadius}`}
          fill="none"
          stroke={fill}
        />
        <path
          d={`M${cx},${cy}l0,${-outerRadius}`}
          fill="none"
          stroke={fill}
        />
      </g>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 text-red-500 p-4 rounded-lg text-center">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, <span className="text-indigo-600">{dashboardData?.user?.name || dashboardData?.user?.email?.split('@')[0] || 'User'}</span>! 👋
          </h1>
          <p className="text-gray-600">Here's an overview of your fundraising journey.</p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-indigo-100">
                <RocketLaunchIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <h3 className="text-2xl font-bold text-gray-900">{dashboardData.campaigns.length}</h3>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Donations Made</p>
                <h3 className="text-2xl font-bold text-gray-900">${dashboardData.totalDonations.toLocaleString()}</h3>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-pink-100">
                <HeartIcon className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Funds Raised</p>
                <h3 className="text-2xl font-bold text-gray-900">${dashboardData.totalRaised.toLocaleString()}</h3>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-pink-600 h-1.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-rose-100">
                <ArrowTrendingUpIcon className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {Math.round((dashboardData.campaigns.filter(c => c.status === 'completed').length / 
                    (dashboardData.campaigns.length || 1)) * 100)}%
                </h3>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Campaign Funds Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Funds Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.campaigns.map(campaign => ({
                      name: campaign.title.length > 20 ? campaign.title.substring(0, 20) + '...' : campaign.title,
                      value: campaign.raisedAmount || 0
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dashboardData.campaigns.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${(index * 360) / dashboardData.campaigns.length}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const totalRaised = dashboardData.campaigns.reduce((sum, campaign) => sum + (campaign.raisedAmount || 0), 0);
                        const percentage = ((data.value / totalRaised) * 100).toFixed(1);
                        return (
                          <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                            <p className="font-medium text-gray-900">{data.name}</p>
                            <p className="text-sm text-gray-600">
                              Amount: ${data.value.toLocaleString()}
                            </p>
                            <p className="text-sm font-medium text-indigo-600">
                              {percentage}% of total funds
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const campaign = dashboardData.campaigns.find(c => 
                        c.title === value || (c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title) === value
                      );
                      if (campaign) {
                        return `${value} ($${(campaign.raisedAmount || 0).toLocaleString()})`;
                      }
                      return value;
                    }}
                    wrapperStyle={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              Total Funds Raised: ${dashboardData.totalRaised.toLocaleString()}
            </div>
          </div>

          {/* Campaign Status Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Status Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: dashboardData.campaigns.filter(c => c.status === 'completed').length },
                      { name: 'Active', value: dashboardData.campaigns.filter(c => c.status === 'approved').length },
                      { name: 'Pending', value: dashboardData.campaigns.filter(c => c.status === 'pending').length },
                      { name: 'Other', value: dashboardData.campaigns.filter(c => !['completed', 'approved', 'pending'].includes(c.status)).length }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dashboardData.campaigns.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                            <p className="font-medium text-gray-900">{data.name}</p>
                            <p className="text-sm text-gray-600">
                              Count: {data.value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* My Campaigns Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Campaigns</h2>
            <Link
              to="/create-campaign"
              className="group relative inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5"
            >
              <RocketLaunchIcon className="w-5 h-5 mr-2" />
              <span>Create Campaign</span>
              <div className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
            </Link>
          </div>

          {dashboardData.campaigns.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                <RocketLaunchIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Your First Campaign</h3>
              <p className="text-gray-600 mb-6">Create a campaign and start making a difference today!</p>
              <Link
                to="/create-campaign"
                className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5"
              >
                <RocketLaunchIcon className="w-5 h-5 mr-2" />
                Create Campaign
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  {campaign.mediaUrls?.[0] && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={campaign.mediaUrls[0]}
                        alt={campaign.title}
                        className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          campaign.status === 'approved' ? 'bg-green-400/90 text-white' :
                          campaign.status === 'pending' ? 'bg-yellow-400/90 text-white' :
                          'bg-red-400/90 text-white'
                        }`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">
                      {campaign.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)}%`,
                          }}
                        >
                          <div className="w-full h-full bg-white/20 animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="text-gray-600">${campaign.raisedAmount.toLocaleString()} raised</span>
                        <span className="font-medium text-indigo-600">${campaign.goalAmount.toLocaleString()} goal</span>
                      </div>
                    </div>
                    <Link
                      to={`/campaigns/${campaign._id}`}
                      className="block text-center px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md hover:shadow-lg transform transition-all duration-200 hover:-translate-y-0.5"
                    >
                      View Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Recent Donations Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Donations</h2>
          {dashboardData.donations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <HeartIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Donations Yet</h3>
              <p className="text-gray-600 mb-6">Start supporting campaigns that matter to you!</p>
              <Link
                to="/campaigns"
                className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5"
              >
                <HeartIcon className="w-5 h-5 mr-2" />
                Browse Campaigns
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.donations.map((donation) => (
                      <tr key={donation._id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {donation.campaignId.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-indigo-600">
                            ${donation.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            to={`/campaigns/${donation.campaignId._id}`}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                          >
                            View Campaign
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default Dashboard;