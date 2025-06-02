const express = require('express');
const { getUserDashboard, getDonationHistory, getCampaignStats } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/user', authMiddleware, getUserDashboard);
router.get('/donations', authMiddleware, getDonationHistory);
router.get('/campaigns/:campaignId/stats', authMiddleware, getCampaignStats);

module.exports = router;