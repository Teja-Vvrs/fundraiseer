const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, decoded:', { userId: decoded.userId, role: decoded.role });
    
    // Get fresh user data from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Set user info from database (not from token)
    req.user = {
      _id: user._id,
      userId: user._id,
      role: user.role,
      email: user.email,
      name: user.name
    };
    
    console.log('Auth middleware set user:', req.user);
    
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', error: error.message });
    }
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

const admin = async (req, res, next) => {
  try {
    // Ensure user exists in request
    if (!req.user) {
      console.log('No user object found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get fresh user data to ensure role is current
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    // Check current role from database
    if (user.role !== 'admin') {
      console.log('User role is not admin:', user.role);
    return res.status(403).json({ message: 'Admin access required' });
  }

    console.log('Admin access granted for user:', user._id);
  next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, admin }; 