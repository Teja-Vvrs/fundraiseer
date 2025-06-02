const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const {
  getUsers,
  getDashboardStats,
  getRecentCampaigns,
  createAdmin,
  updateUserRole,
  getPendingCampaigns,
  getAllCampaigns,
  moderateCampaign
} = require('../controllers/adminController');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Donation = require('../models/Donation');

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(admin);

// User management
router.get('/users', getUsers);
router.patch('/users/:userId/role', updateUserRole);

// Campaign management
router.get('/campaigns', getAllCampaigns);
router.get('/campaigns/pending', getPendingCampaigns);
router.get('/campaigns/recent', getRecentCampaigns);
router.patch('/campaigns/:campaignId/moderate', moderateCampaign);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Admin creation
router.post('/create-admin', createAdmin);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    const totalDonations = await Donation.countDocuments();
    const totalRaised = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      totalUsers,
      totalCampaigns,
      totalDonations,
      totalRaised: totalRaised[0]?.total || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

module.exports = router; 