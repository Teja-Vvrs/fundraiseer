import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { campaignAPI } from '../utils/api';
import { 
  HeartIcon, 
  ShareIcon, 
  CalendarIcon, 
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Campaign = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [showDonationForm, setShowDonationForm] = useState(false);

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      const response = await campaignAPI.getCampaign(id);
      setCampaign(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaign details');
      console.error('Campaign error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDonation = async (e) => {
    e.preventDefault();
    try {
      await campaignAPI.donate(id, { amount: parseFloat(donationAmount) });
      await fetchCampaignDetails();
      setDonationAmount('');
      setShowDonationForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process donation');
    }
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

  const progressPercentage = Math.min(
    Math.round((campaign.raisedAmount / campaign.goalAmount) * 100),
    100
  );

  const timeLeft = () => {
    const end = new Date(campaign.endDate);
    const now = new Date();
    const diff = end - now;
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    return days;
  };

  const donationData = campaign.donations.map(donation => ({
    date: new Date(donation.createdAt).toLocaleDateString(),
    amount: donation.amount
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Campaign Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden mb-8"
        >
          <div className="relative h-96">
            {campaign.mediaUrls?.[0] && (
              <>
                <img
                  src={campaign.mediaUrls[0]}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
              </>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  campaign.status === 'approved' ? 'bg-green-500/90' :
                  campaign.status === 'pending' ? 'bg-yellow-500/90' :
                  'bg-red-500/90'
                }`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-5 h-5" />
                  {new Date(campaign.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-2">{campaign.title}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5" />
                  <span>{campaign.donations.length} Donors</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>{timeLeft()} Days Left</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            {/* Campaign Description */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">About this Campaign</h2>
              <p className="text-gray-600 whitespace-pre-line">{campaign.description}</p>
            </div>

            {/* Donation Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Donation History</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={donationData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#6366f1" 
                      fill="url(#colorGradient)" 
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Donors */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Donors</h2>
              {campaign.donations.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Be the first one to donate!</p>
              ) : (
                <div className="space-y-4">
                  {campaign.donations.slice(0, 5).map((donation, index) => (
                    <motion.div
                      key={donation._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <HeartIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Anonymous Donor</p>
                          <p className="text-sm text-gray-500">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-indigo-600">
                        ${donation.amount.toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Campaign Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-lg font-semibold text-indigo-600">{progressPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="w-full h-full bg-white/20 animate-shimmer"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <CurrencyDollarIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Raised</p>
                      <p className="font-semibold text-gray-900">
                        ${campaign.raisedAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Goal</p>
                    <p className="font-semibold text-gray-900">
                      ${campaign.goalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <UserGroupIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Donors</p>
                      <p className="font-semibold text-gray-900">
                        {campaign.donations.length}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Days Left</p>
                    <p className="font-semibold text-gray-900">{timeLeft()}</p>
                  </div>
                </div>
              </div>

              {/* Donation Form */}
              {!showDonationForm ? (
                <button
                  onClick={() => setShowDonationForm(true)}
                  className="w-full mt-6 px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5"
                >
                  Donate Now
                </button>
              ) : (
                <form onSubmit={handleDonation} className="mt-6">
                  <div className="mb-4">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Amount ($)
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDonationForm(false)}
                      className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Share Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Share this Campaign</h3>
              <div className="flex gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200">
                  <ShareIcon className="w-5 h-5" />
                  Share
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors duration-200">
                  <HeartIcon className="w-5 h-5" />
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Campaign; 