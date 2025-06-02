const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  updateProfile,
  getProfile
} = require('../controllers/users');

// Profile routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router; 