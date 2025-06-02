const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');
const rateLimit = require('express-rate-limit');
const {
  submitContact,
  getAdminContacts,
  getAdminContactById,
  updateContactStatus,
  getContactStats,
  getUserMessages
} = require('../controllers/contact');

// Rate limiting for contact submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many contact requests. Please try again later.'
});

// Public routes with optional auth
router.post('/', contactLimiter, auth, submitContact);

// User routes
router.get('/user/messages', auth, getUserMessages);

// Admin routes
router.get('/admin/stats', auth, isAdmin, getContactStats);
router.get('/admin', auth, isAdmin, getAdminContacts);
router.get('/admin/:id', auth, isAdmin, getAdminContactById);
router.put('/admin/:id', auth, isAdmin, updateContactStatus);

module.exports = router; 