const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const mongoose = require('mongoose');
const { validateObjectId } = require('../utils/validation');
const jwt = require('jsonwebtoken');

// Get all users with detailed stats
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 });

    // Get additional stats for each user using aggregation
    const usersWithStats = await User.aggregate([
      {
        $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: 'creatorId',
          as: 'campaigns'
        }
      },
      {
        $lookup: {
          from: 'donations',
          localField: '_id',
          foreignField: 'userId',
          as: 'donations'
        }
      },
      {
        $project: {
          _id: 1,
          email: 1,
          name: 1,
          role: 1,
          createdAt: 1,
          stats: {
            campaignsCreated: { $size: '$campaigns' },
            donationsMade: { $size: '$donations' },
            totalDonated: { $sum: '$donations.amount' }
          }
        }
      }
    ]);

    res.status(200).json(usersWithStats);
  } catch (error) {
    console.error('Admin Controller - Get users error:', error);
    res.status(500).json({ message: 'An error occurred while fetching users' });
  }
};

// Get dashboard statistics with caching
const getDashboardStats = async (req, res) => {
  try {
    // Get all required stats in parallel
    const [
      userStats,
      campaignStats,
      donationStats,
      contactStats
    ] = await Promise.all([
      // User stats
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            admins: {
              $sum: {
                $cond: [{ $eq: ['$role', 'admin'] }, 1, 0]
              }
            }
          }
        }
      ]),
      // Campaign stats
      Campaign.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            approved: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
              }
            }
          }
        }
      ]),
      // Donation stats
      Donation.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ]),
      // Contact stats (if you have a Contact model)
      Promise.resolve([{ total: 0, unresolved: 0 }]) // Default if no Contact model
    ]);

    const formattedStats = {
      users: {
        total: userStats[0]?.total || 0,
        admins: userStats[0]?.admins || 0
      },
      campaigns: {
        total: campaignStats[0]?.total || 0,
        pending: campaignStats[0]?.pending || 0,
        approved: campaignStats[0]?.approved || 0
      },
      donations: {
        count: donationStats[0]?.count || 0,
        amount: donationStats[0]?.amount || 0
      },
      contacts: {
        total: contactStats[0]?.total || 0,
        unresolved: contactStats[0]?.unresolved || 0
      }
    };

    console.log('Formatted dashboard stats:', formattedStats);
    res.json(formattedStats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'An error occurred while fetching dashboard stats' });
  }
};

// Get recent campaigns with validation
const getRecentCampaigns = async (req, res) => {
  try {
    const { limit = 5, page = 1 } = req.query;
    
    // Validate pagination parameters
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 50);
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const campaigns = await Campaign.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'creatorId',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: '$creator' },
      {
        $project: {
          title: 1,
          description: 1,
          status: 1,
          createdAt: 1,
          raisedAmount: 1,
          goalAmount: 1,
          'creator.name': 1,
          'creator.email': 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parsedLimit }
    ]);

    const total = await Campaign.countDocuments();

    res.json({
      campaigns,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Get recent campaigns error:', error);
    res.status(500).json({ message: 'An error occurred while fetching campaigns' });
  }
};

// Create admin with validation
const createAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        errors: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          name: !name ? 'Name is required' : null
        }
      });
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
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new admin user
    const user = new User({
      email,
      password,
      name,
      role: 'admin'
    });

    await user.save({ session });
    await session.commitTransaction();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    await session.abortTransaction();
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'An error occurred while creating admin user' });
  } finally {
    session.endSession();
  }
};

// Update user role with validation
const updateUserRole = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Log the incoming request
    console.log('Role update request:', {
      userId,
      newRole: role,
      requestBody: req.body,
      currentUser: req.user
    });

    // Validate request body
    if (!role) {
      console.log('Missing role in request body');
      return res.status(400).json({ message: 'Role is required in request body' });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid user ID format:', userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      console.log('Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role. Must be either "user" or "admin"' });
    }

    // Prevent self-role-change
    if (userId === req.user.userId) {
      console.log('Attempted self-role change');
      return res.status(403).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findById(userId).session(session);

    if (!user) {
      console.log('User not found:', userId);
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user:', { 
      userId: user._id, 
      currentRole: user.role, 
      newRole: role,
      userDetails: user.toObject() 
    });

    // Prevent changing the role of the last admin
    if (user.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' }).session(session);
      console.log('Admin count:', adminCount);
      if (adminCount <= 1) {
        console.log('Attempted to change last admin');
        await session.abortTransaction();
        return res.status(400).json({ message: 'Cannot change role of the last admin' });
      }
    }

    // Only update if role is actually changing
    if (user.role !== role) {
      user.role = role;
      // Add a flag to indicate this is a fresh password reset needed
      user.requirePasswordReset = true;
      try {
        await user.save({ session });
        console.log('Role updated successfully:', {
          userId: user._id,
          oldRole: user.role,
          newRole: role
        });
      } catch (saveError) {
        console.error('Error saving user:', saveError);
        await session.abortTransaction();
        throw saveError;
      }
    } else {
      console.log('Role unchanged - already set to:', role);
    }

    try {
      await session.commitTransaction();
      console.log('Transaction committed successfully');
    } catch (commitError) {
      console.error('Error committing transaction:', commitError);
      await session.abortTransaction();
      throw commitError;
    }

    res.json({
      message: 'User role updated successfully. User must reset password on next login.',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        requirePasswordReset: true
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update user role error:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId,
      requestedRole: req.body.role
    });
    res.status(500).json({ 
      message: 'An error occurred while updating user role',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

// Get pending campaigns with validation
const getPendingCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Validate pagination parameters
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 50);
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [campaigns, total] = await Promise.all([
      Campaign.aggregate([
        { $match: { status: 'pending' } },
        {
          $lookup: {
            from: 'users',
            localField: 'creatorId',
            foreignField: '_id',
            as: 'creator'
          }
        },
        { $unwind: '$creator' },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'campaignId',
            as: 'comments'
          }
        },
        {
          $lookup: {
            from: 'campaigns',
            let: { creatorId: '$creatorId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$creatorId', '$$creatorId'] }
                }
              },
              {
                $group: {
                  _id: null,
                  totalCampaigns: { $sum: 1 },
                  totalRaised: { $sum: '$raisedAmount' }
                }
              }
            ],
            as: 'creatorStats'
          }
        },
        { $unwind: { path: '$creatorStats', preserveNullAndEmptyArrays: true } },
        { $skip: skip },
        { $limit: parsedLimit }
      ]),
      Campaign.countDocuments({ status: 'pending' })
    ]);

    res.status(200).json({
      campaigns,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Admin Controller - Get pending campaigns error:', error);
    res.status(500).json({ message: 'An error occurred while fetching pending campaigns' });
  }
};

// Get all campaigns with validation
const getAllCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    // Validate pagination parameters
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 50);
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // Build match stage
    const matchStage = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      matchStage.status = status;
    }
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [campaigns, total] = await Promise.all([
      Campaign.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'creatorId',
            foreignField: '_id',
            as: 'creator'
          }
        },
        { $unwind: '$creator' },
        {
          $lookup: {
            from: 'donations',
            localField: '_id',
            foreignField: 'campaignId',
            as: 'donations'
          }
        },
        {
          $addFields: {
            stats: {
              totalDonors: { $size: '$donations' },
              avgDonation: {
                $cond: [
                  { $gt: [{ $size: '$donations' }, 0] },
                  { $avg: '$donations.amount' },
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            title: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            raisedAmount: 1,
            goalAmount: 1,
            category: 1,
            'creator.name': 1,
            'creator.email': 1,
            stats: 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parsedLimit }
      ]),
      Campaign.countDocuments(matchStage)
    ]);

    res.status(200).json({
      campaigns,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Admin Controller - Get all campaigns error:', error);
    res.status(500).json({ message: 'An error occurred while fetching campaigns' });
  }
};

// Moderate campaign with validation
const moderateCampaign = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { campaignId } = req.params;
    const { status, note } = req.body;

    // Validate campaignId
    if (!validateObjectId(campaignId)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be either "approved" or "rejected"' });
    }

    // Validate note
    if (status === 'rejected' && (!note || note.trim().length < 10)) {
      return res.status(400).json({ message: 'A detailed note is required when rejecting a campaign' });
    }

    const campaign = await Campaign.findById(campaignId).session(session);

    if (!campaign) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Can only moderate pending campaigns' });
    }

    campaign.status = status;
    campaign.moderationNote = note;
    campaign.moderatedBy = req.user.userId;
    campaign.moderatedAt = new Date();

    await campaign.save({ session });
    await session.commitTransaction();

    res.json({
      message: `Campaign ${status} successfully`,
      campaign: {
        _id: campaign._id,
        title: campaign.title,
        status: campaign.status,
        moderationNote: campaign.moderationNote,
        moderatedAt: campaign.moderatedAt
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Moderate campaign error:', error);
    res.status(500).json({ message: 'An error occurred while moderating the campaign' });
  } finally {
    session.endSession();
  }
};

module.exports = {
  getUsers,
  getDashboardStats,
  getRecentCampaigns,
  createAdmin,
  updateUserRole,
  getPendingCampaigns,
  getAllCampaigns,
  moderateCampaign
}; 