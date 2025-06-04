const express = require('express');
const { 
  createCampaign, 
  getCampaigns, 
  getPendingCampaigns, 
  moderateCampaign, 
  getCampaignById, 
  donateToCampaign,
  addComment,
  deleteComment,
  recalculateAllCampaignAmounts
} = require('../controllers/campaignController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// Optional auth middleware to handle both authenticated and unauthenticated requests
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return next();
  }
  return authMiddleware(req, res, next);
};

// Public routes
router.get('/', optionalAuth, getCampaigns);
router.get('/:campaignId', optionalAuth, getCampaignById);

// Protected routes
router.post('/create', authMiddleware, createCampaign);
router.post('/:campaignId/donate', authMiddleware, donateToCampaign);
router.post('/:campaignId/comments', authMiddleware, addComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

// Admin routes
router.get('/admin/pending', authMiddleware, adminMiddleware, getPendingCampaigns);
router.patch('/:campaignId/moderate', authMiddleware, adminMiddleware, moderateCampaign);
router.post('/recalculate', authMiddleware, adminMiddleware, recalculateAllCampaignAmounts);

module.exports = router;