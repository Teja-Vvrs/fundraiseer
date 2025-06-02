const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const fs = require('fs').promises;
const path = require('path');

// Helper function to get full URL
const getFullUrl = (req, path) => {
  return `${req.protocol}://${req.get('host')}${path}`;
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');
  res.json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if email is being changed
  const emailChanged = req.body.email && req.body.email !== user.email;
  
  if (emailChanged) {
    // Check if new email already exists
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already in use');
    }
    // For testing, directly update email without verification
    user.email = req.body.email;
  }

  // If changing password, verify current password
  if (req.body.newPassword) {
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }
    user.password = req.body.newPassword;
  }

  user.name = req.body.name || user.name;
  
  const updatedUser = await user.save();
  
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatar: updatedUser.avatar,
    role: updatedUser.role
  });
});

// @desc    Update user avatar
// @route   POST /api/users/avatar
// @access  Private
const updateAvatar = asyncHandler(async (req, res) => {
  console.log('Update avatar request:', {
    file: req.file,
    userId: req.user.userId
  });

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  const user = await User.findById(req.user.userId);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Delete old avatar if exists
  if (user.avatar) {
    try {
      const oldAvatarPath = path.join(__dirname, '..', 'uploads', 'avatars', path.basename(user.avatar));
      console.log('Attempting to delete old avatar:', oldAvatarPath);
      await fs.unlink(oldAvatarPath);
      console.log('Old avatar deleted successfully');
    } catch (error) {
      console.error('Error deleting old avatar:', error);
    }
  }

  // Update user with new avatar path using findByIdAndUpdate to avoid validation
  const avatarPath = `/api/uploads/avatars/${req.file.filename}`;
  const fullAvatarUrl = getFullUrl(req, avatarPath);
  
  const updatedUser = await User.findByIdAndUpdate(
    req.user.userId,
    { avatar: fullAvatarUrl },
    { 
      new: true,
      runValidators: false,
      select: '-password'
    }
  );

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatar: updatedUser.avatar,
    role: updatedUser.role
  });
});

// @desc    Delete user avatar
// @route   DELETE /api/users/avatar
// @access  Private
const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.avatar) {
    try {
      const avatarPath = path.join(__dirname, '..', 'uploads', 'avatars', path.basename(user.avatar));
      await fs.unlink(avatarPath);
    } catch (error) {
      console.error('Error deleting avatar:', error);
    }
  }

  user.avatar = null;
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: null,
    role: user.role
  });
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAvatar
}; 