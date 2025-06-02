const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

// Create rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3 // limit each IP to 3 requests per windowMs
});

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate secure OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send password reset OTP
const sendPasswordResetOTP = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return same message as success to prevent email enumeration
      return res.status(200).json({ message: 'If the email exists, an OTP has been sent' });
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store OTP with expiry
    otpStore.set(email, {
      otp: await bcrypt.hash(otp, 10), // Hash OTP before storing
      expiry: expiryTime
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - Fundraiseer',
      html: `
        <h1>Password Reset Request</h1>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'If the email exists, an OTP has been sent' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
};

// Verify password reset OTP
const verifyPasswordResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isValidOTP = await bcrypt.compare(otp, storedData.otp);
    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (Date.now() > storedData.expiry) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Generate a temporary token for password reset
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({ resetToken });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
};

// Reset password with token verification
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Update password and clear reset flag
    user.password = newPassword;
    user.requirePasswordReset = false;
    await user.save();

    res.status(200).json({ 
      message: 'Password reset successful. You can now login with your new password.',
      email: user.email
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'An error occurred while resetting password' });
  }
};

// Register a new user
const registerUser = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new user
    const user = new User({ 
      email, 
      password, 
      name,
      role: 'user' // Force default role for security
    });
    
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      token, 
      user: { 
        _id: user._id,
        email: user.email, 
        role: user.role,
        name: user.name
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid input data' });
    }
    res.status(500).json({ message: 'An error occurred' });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password reset is required
    if (user.requirePasswordReset) {
      return res.status(403).json({ 
        message: 'Your account role has been changed from admin to user by an administrator. For security reasons, you need to reset your password before continuing. Please use the "Forgot Password" option on the login page.',
        requirePasswordReset: true,
        email: user.email,
        redirectTo: '/forgot-password'
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      token, 
      user: { 
        _id: user._id,
        email: user.email, 
        role: user.role,
        name: user.name
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    });
  } catch (error) {
    console.error('Error in getMe controller:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  loginLimiter,
  otpLimiter
}; 