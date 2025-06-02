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
const { formDataParser } = require('../middleware/upload');
const router = express.Router();

// Optional auth middleware to handle both authenticated and unauthenticated requests
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return next();
  }
  return authMiddleware(req, res, next);
};

// Campaign routes
router.post('/create', authMiddleware, formDataParser, createCampaign);
router.get('/', optionalAuth, getCampaigns);
router.get('/pending', authMiddleware, adminMiddleware, getPendingCampaigns);
router.put('/:campaignId/moderate', authMiddleware, adminMiddleware, moderateCampaign);
router.get('/:campaignId', optionalAuth, getCampaignById);
router.post('/:campaignId/donate', authMiddleware, donateToCampaign);
router.post('/:campaignId/comments', authMiddleware, addComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

// Admin route to recalculate all campaign amounts
router.post('/recalculate-amounts', authMiddleware, adminMiddleware, recalculateAllCampaignAmounts);

module.exports = router;