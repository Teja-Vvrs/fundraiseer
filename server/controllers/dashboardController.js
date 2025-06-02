const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const User = require('../models/User');
const mongoose = require('mongoose');

// User dashboard: Get user's campaigns and donations
const getUserDashboard = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    console.log('Fetching dashboard for user:', req.user.userId);

    // Get user's campaigns
    const campaigns = await Campaign.find({ 
      creatorId: userId,
    }).populate('creatorId', 'name email');

    console.log('Found campaigns:', campaigns.length);

    // Get user data
    const user = await User.findById(userId).select('name email');

    // Get user's donations
    const donations = await Donation.find({ 
      userId: userId 
    }).populate({
      path: 'campaignId',
      select: 'title'
    }).sort({ createdAt: -1 });

    // Calculate total donations made by user
    const totalDonations = await Donation.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate total funds raised from user's campaigns
    const totalRaised = await Campaign.aggregate([
      { $match: { creatorId: userId } },
      { $group: { _id: null, total: { $sum: '$raisedAmount' } } }
    ]);

    res.status(200).json({
      user,
      campaigns,
      donations,
      totalDonations: totalDonations[0]?.total || 0,
      totalRaised: totalRaised[0]?.total || 0
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's donation history
const getDonationHistory = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const donations = await Donation.find({ userId })
      .populate({
        path: 'campaignId',
        select: 'title description mediaUrls'
      })
      .sort({ createdAt: -1 });

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donation history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get campaign statistics
const getCampaignStats = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findById(campaignId)
      .populate('creatorId', 'name email')
      .lean();
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Verify user has access to this campaign
    const isOwner = campaign.creatorId._id.toString() === req.user.userId;
    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to view these stats' });
    }

    // Get donation statistics
    const donationStats = await Donation.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
      { 
        $group: { 
          _id: null,
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgDonation: { $avg: '$amount' }
        } 
      }
    ]);

    // Get recent donations with donor info
    const recentDonations = await Donation.find({ campaignId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const stats = {
      campaign: {
        title: campaign.title,
        status: campaign.status,
        goalAmount: campaign.goalAmount,
        deadline: campaign.deadline
      },
      donations: {
        total: donationStats[0]?.totalDonations || 0,
        amount: donationStats[0]?.totalAmount || 0,
        average: Math.round(donationStats[0]?.avgDonation || 0),
        recent: recentDonations
      },
      progress: {
        current: donationStats[0]?.totalAmount || 0,
        goal: campaign.goalAmount,
        percentage: ((donationStats[0]?.totalAmount || 0) / campaign.goalAmount) * 100
      }
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ 
      message: 'Error fetching campaign statistics',
      error: error.message 
    });
  }
};

// Admin dashboard: Get site-wide stats and moderation queue
const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    const totalDonations = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const pendingCampaigns = await Campaign.find({ status: 'pending' })
      .populate('creatorId', 'email');

    res.status(200).json({
      totalUsers,
      totalCampaigns,
      totalDonations: totalDonations[0]?.total || 0,
      pendingCampaigns,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getUserDashboard, getDonationHistory, getCampaignStats, getAdminDashboard };