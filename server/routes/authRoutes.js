// backend/routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser, getMe, resetPassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Temporary route to create first admin - REMOVE THIS IN PRODUCTION
router.post('/create-first-admin', async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const user = new User({
      email: 'admin@fundraiseer.com',
      password: hashedPassword,
      role: 'admin'
    });

    await user.save();
    res.status(201).json({ 
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@fundraiseer.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Temporary route to reset admin password - REMOVE THIS IN PRODUCTION
router.post('/reset-admin-password', async (req, res) => {
  try {
    // Find admin by the specific ID you provided
    const admin = await User.findById("683ad37414babd0b15772eee");
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Generate new salt and hash
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password directly in the database to bypass any middleware
    const result = await User.updateOne(
      { _id: "683ad37414babd0b15772eee" },
      { $set: { password: hashedPassword } }
    );

    console.log('Password reset result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      newHash: hashedPassword
    });

    res.status(200).json({ 
      message: 'Admin password reset successfully',
      credentials: {
        email: admin.email,
        password: password
      }
    });
  } catch (error) {
    console.error('Reset admin password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, getMe);

// Password reset route
router.post('/reset-password', resetPassword);

module.exports = router;