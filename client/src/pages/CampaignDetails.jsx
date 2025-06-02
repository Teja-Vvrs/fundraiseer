import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { campaignAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  HeartIcon, 
  ShareIcon, 
  CalendarIcon, 
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon
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
import { toast } from 'react-toastify';

const CampaignDetails = () => {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [processingDonation, setProcessingDonation] = useState(false);

  // Process donation data for the chart
  const processedDonationData = React.useMemo(() => {
    if (!campaign?.donations?.length) return [];
    
    // Sort donations by date
    const sortedDonations = [...campaign.donations].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Create cumulative data points
    let cumulativeAmount = 0;
    const data = sortedDonations.map(donation => {
      cumulativeAmount += parseFloat(donation.amount);
      return {
        date: new Date(donation.createdAt).toLocaleDateString(),
        amount: parseFloat(donation.amount),
        total: cumulativeAmount,
        donor: donation.userId?.name || 'Anonymous'
      };
    });

    // Add initial point if there are donations
    if (data.length > 0) {
      data.unshift({
        date: new Date(sortedDonations[0].createdAt).toLocaleDateString(),
        amount: 0,
        total: 0,
        donor: 'Start'
      });
    }

    return data;
  }, [campaign?.donations]);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await campaignAPI.getCampaignById(campaignId);
        setCampaign(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load campaign details';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId]);

  const handleDonation = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        toast.error('Please login to make a donation');
        return;
      }

      const amount = parseFloat(donationAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid donation amount');
        return;
      }

      // Calculate remaining amount needed
      const remainingAmount = campaign.goalAmount - (campaign.raisedAmount || 0);
      
      // Check if donation exceeds remaining amount
      if (amount > remainingAmount) {
        toast.error(`The maximum donation amount allowed is $${remainingAmount.toLocaleString()}. This campaign only needs $${remainingAmount.toLocaleString()} more to reach its goal.`);
        return;
      }

      setProcessingDonation(true);
      await campaignAPI.donateToCampaign(campaignId, amount);
      
      // Refresh campaign details
      const response = await campaignAPI.getCampaignById(campaignId);
      setCampaign(response.data);
      
      setDonationAmount('');
      setShowDonationForm(false);
      toast.success('Thank you for your donation!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to process donation';
      toast.error(errorMessage);
    } finally {
      setProcessingDonation(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      await campaignAPI.addComment(campaignId, comment);
      
      // Refresh campaign details to get updated comments
      const response = await campaignAPI.getCampaignById(campaignId);
      setCampaign(response.data);
      
      setComment('');
      toast.success('Comment added successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add comment';
      toast.error(errorMessage);
    } finally {
      setSubmittingComment(false);
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
    Math.round(((campaign?.raisedAmount || 0) / (campaign?.goalAmount || 1)) * 100),
    100
  );

  const timeLeft = () => {
    if (!campaign?.deadline) return 0;
    const end = new Date(campaign.deadline);
    const now = new Date();
    const diff = end - now;
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    return days;
  };

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
            {campaign?.mediaUrls?.[0] ? (
              <>
                <img
                  src={campaign.mediaUrls[0]}
                  alt={campaign.title || 'Campaign Image'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  campaign?.status === 'approved' ? 'bg-green-500/90' :
                  campaign?.status === 'pending' ? 'bg-yellow-500/90' :
                  'bg-red-500/90'
                }`}>
                  {(campaign?.status || 'unknown').charAt(0).toUpperCase() + (campaign?.status || 'unknown').slice(1)}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-5 h-5" />
                  {campaign?.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'Unknown date'}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-2">{campaign?.title || 'Untitled Campaign'}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5" />
                  <span>{campaign?.donations?.length || 0} Donors</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>{timeLeft()} Days Left</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Campaign Stats and Donation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campaign Stats */}
            <div>
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
                        ${(campaign?.raisedAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Goal</p>
                    <p className="font-semibold text-gray-900">
                      ${(campaign?.goalAmount || 0).toLocaleString()}
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
                        {campaign?.donations?.length || 0}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Days Left</p>
                    <p className="font-semibold text-gray-900">{timeLeft()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Donation Form */}
            <div>
              {campaign?.creatorId?._id === user?._id ? (
                <div className={`w-full px-6 py-4 rounded-xl text-center ${
                  campaign?.status === 'approved' ? 'bg-green-100 border-2 border-green-500' :
                  campaign?.status === 'pending' ? 'bg-yellow-100 border-2 border-yellow-500' :
                  'bg-red-100 border-2 border-red-500'
                }`}>
                  <h3 className="text-lg font-semibold mb-2">Your Campaign Status</h3>
                  <div className={`text-base font-medium ${
                    campaign?.status === 'approved' ? 'text-green-800' :
                    campaign?.status === 'pending' ? 'text-yellow-800' :
                    'text-red-800'
                  }`}>
                    {campaign?.status === 'approved' ? '✓ Campaign Approved' :
                     campaign?.status === 'pending' ? '⏳ Pending Approval' :
                     '✕ Campaign Rejected'}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {campaign?.status === 'approved' ? 'Your campaign is live and accepting donations.' :
                     campaign?.status === 'pending' ? 'Your campaign is under review by our team.' :
                     'Your campaign has been rejected. Please contact support for more information.'}
                  </p>
                </div>
              ) : campaign?.status !== 'approved' ? (
                <div className={`w-full px-6 py-4 rounded-xl text-center ${
                  campaign?.status === 'pending' ? 'bg-yellow-100 border-2 border-yellow-500' :
                  'bg-red-100 border-2 border-red-500'
                }`}>
                  <h3 className="text-lg font-semibold mb-2">Campaign Status</h3>
                  <div className={`text-base font-medium ${
                    campaign?.status === 'pending' ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {campaign?.status === 'pending' ? '⏳ Pending Approval' : '✕ Campaign Unavailable'}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {campaign?.status === 'pending' ? 
                      'This campaign is currently under review and not accepting donations.' :
                      'This campaign is not available for donations at this time.'}
                  </p>
                </div>
              ) : !showDonationForm ? (
                <button
                  onClick={() => setShowDonationForm(true)}
                  className="w-full px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 text-lg font-semibold"
                >
                  Donate Now
                </button>
              ) : (
                <form onSubmit={handleDonation} className="space-y-4">
                  <div>
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
                      disabled={processingDonation}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={processingDonation || !user}
                      className={`flex-1 px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 text-lg font-semibold relative ${
                        (processingDonation || !user) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {processingDonation ? (
                        <>
                          <span className="opacity-0">Confirm</span>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </>
                      ) : (
                        'Confirm'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDonationForm(false)}
                      disabled={processingDonation}
                      className={`flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 ${
                        processingDonation ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Share Section */}
              <div className="mt-6">
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
              <p className="text-gray-600 whitespace-pre-line">{campaign?.description || 'No description available'}</p>
            </div>

            {/* Donation Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Donation History</h2>
              {processedDonationData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={processedDonationData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tick={{ fill: '#4B5563' }}
                        tickLine={{ stroke: '#4B5563' }}
                      />
                      <YAxis 
                        tick={{ fill: '#4B5563' }}
                        tickLine={{ stroke: '#4B5563' }}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">{data.date}</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  Amount: ${data.amount.toLocaleString()}
                                </p>
                                <p className="text-sm font-semibold text-indigo-600">
                                  Total: ${data.total.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {data.donor === 'Start' ? 'Campaign Start' : `Donor: ${data.donor}`}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#6366f1"
                        fill="url(#colorGradient)"
                        strokeWidth={2}
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
              ) : (
                <div className="text-center py-10">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No donations yet</p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Comments</h2>
              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="mb-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows="3"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingComment || !user}
                  className={`px-6 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:-translate-y-0.5 ${
                    (submittingComment || !user) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
                {!user && (
                  <p className="mt-2 text-sm text-gray-600">
                    Please <Link to="/login" className="text-indigo-600 hover:text-indigo-800">login</Link> to comment
                  </p>
                )}
              </form>

              {/* Comments List */}
              <div className="space-y-6">
                {!campaign?.comments?.length ? (
                  <p className="text-gray-600 text-center py-4">No comments yet. Be the first to comment!</p>
                ) : (
                  campaign.comments.map((comment, index) => (
                    <motion.div
                      key={comment._id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <ChatBubbleLeftIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {comment.userId?.name || 'Anonymous'}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600">{comment.text}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Recent Donors */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Donors</h3>
              {!campaign?.donations?.length ? (
                <div className="text-center py-6">
                  <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Be the first one to donate!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaign.donations
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
                    .map((donation, index) => (
                      <motion.div
                        key={donation._id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {(donation.userId?.name || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {donation.userId?.name || 'Anonymous Donor'}
                            </p>
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

            {/* Campaign Updates */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Campaign Updates</h3>
              <div className="space-y-4">
                {campaign?.updates?.length ? (
                  campaign.updates.map((update, index) => (
                    <div key={index} className="border-l-2 border-indigo-500 pl-4">
                      <p className="text-sm text-gray-500">{new Date(update.date).toLocaleDateString()}</p>
                      <p className="text-gray-800 mt-1">{update.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No updates yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Organizer */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Campaign Organizer</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-semibold">
                  {(campaign?.organizer?.name || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{campaign?.organizer?.name || 'Anonymous'}</h4>
                  <p className="text-sm text-gray-600">Campaign Organizer</p>
                  <button className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Contact Organizer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;