const Campaign = require('../models/Campaign');
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Comment = require('../models/Comment');

// Default category images from Unsplash
const categoryImages = {
  education: [
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
    'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800'
  ],
  medical: [
    'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?w=800',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800'
  ],
  environment: [
    'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800'
  ],
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800'
  ],
  community: [
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
    'https://images.unsplash.com/photo-1526958097901-5e6d742d3371?w=800',
    'https://images.unsplash.com/photo-1559660499-91e5a0cccd64?w=800'
  ],
  other: [
    'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800',
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
    'https://images.unsplash.com/photo-1510797215324-95aa89f43c33?w=800'
  ]
};

// Helper function to get random image for a category
const getRandomImage = (category) => {
  const images = categoryImages[category] || categoryImages.other;
  return images[Math.floor(Math.random() * images.length)];
};

const createCampaign = async (req, res) => {
  try {
    const {
      title,
      description,
      goalAmount,
      deadline,
      category,
      fundUtilizationPlan
    } = req.body;

    // Validate required fields
    const requiredFields = {
      title: 'Title is required',
      description: 'Description is required',
      goalAmount: 'Goal amount is required',
      deadline: 'Deadline is required',
      category: 'Category is required',
      fundUtilizationPlan: 'Fund utilization plan is required'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !req.body[field])
      .map(([, message]) => message);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        errors: missingFields
      });
    }

    // Validate goal amount
    const parsedGoalAmount = Number(goalAmount);
    if (isNaN(parsedGoalAmount) || parsedGoalAmount <= 0) {
      return res.status(400).json({
        message: 'Invalid goal amount',
        errors: ['Goal amount must be a positive number']
      });
    }

    // Validate deadline
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid deadline',
        errors: ['Deadline must be a valid date']
      });
    }

    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        message: 'Invalid deadline',
        errors: ['Deadline must be in the future']
      });
    }

    // Validate category
    const validCategories = ['education', 'medical', 'environment', 'technology', 'community', 'other'];
    if (!validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({
        message: 'Invalid category',
        errors: [`Category must be one of: ${validCategories.join(', ')}`]
      });
    }

    // Create campaign with default image
    const campaign = new Campaign({
      title: title.trim(),
      description: description.trim(),
      goalAmount: parsedGoalAmount,
      deadline: deadlineDate,
      category: category.toLowerCase(),
      mediaUrls: [getRandomImage(category.toLowerCase())],
      fundUtilizationPlan: fundUtilizationPlan.trim(),
      creatorId: req.user.userId,
      status: req.user.role === 'admin' ? 'approved' : 'pending',
      raisedAmount: 0
    });

    await campaign.save();

    // Fetch the saved campaign with populated fields
    const savedCampaign = await Campaign.findById(campaign._id)
      .populate('creatorId', 'name email')
      .lean();

    res.status(201).json({
      message: req.user.role === 'admin' 
        ? 'Campaign created successfully and automatically approved' 
        : 'Campaign created successfully and pending approval',
      campaign: savedCampaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Campaign validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create campaign',
      error: error.message 
    });
  }
};

const getCampaigns = async (req, res) => {
  try {
    console.log('Getting campaigns with query:', req.query);
    const { page = 1, limit = 10, category, search, needsFunding, sort, includeCompleted = false } = req.query;
    
    // Validate and parse parameters
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ message: 'Invalid limit parameter' });
    }
    
    if (isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({ message: 'Invalid page parameter' });
    }

    // Build base query
    const query = { 
      status: includeCompleted === 'true' 
        ? 'completed'  // Only show completed campaigns when includeCompleted is true
        : 'approved'   // Show approved campaigns by default
    };
    
    // Add category filter if specified
    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    
    // Add search filter if specified
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Add needs funding filter - only apply this when not showing completed campaigns
    if (needsFunding === 'true' && includeCompleted !== 'true') {
      query.$expr = { $lt: ['$raisedAmount', '$goalAmount'] };
    }

    console.log('Executing MongoDB query with:', { query, page: parsedPage, limit: parsedLimit });

    // Build aggregation pipeline
    const pipeline = [
      { $match: query },
      {
        $addFields: {
          remainingAmount: { $subtract: ['$goalAmount', '$raisedAmount'] },
          remainingPercentage: {
            $multiply: [
              { $divide: [{ $subtract: ['$goalAmount', '$raisedAmount'] }, '$goalAmount'] },
              100
            ]
          },
          daysLeft: {
            $max: [
              0,
              {
                $divide: [
                  { $subtract: ['$deadline', new Date()] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              }
            ]
          }
        }
      }
    ];

    // Add sort stage based on sort parameter
    if (sort === 'urgency') {
      pipeline.push({
        $sort: {
          remainingPercentage: -1,
          daysLeft: 1,
          createdAt: -1
        }
      });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Add pagination
    pipeline.push(
      { $skip: (parsedPage - 1) * parsedLimit },
      { $limit: parsedLimit }
    );

    // Execute aggregation pipeline
    const [campaigns, countResult] = await Promise.all([
      Campaign.aggregate(pipeline)
        .exec()
        .then(async (results) => {
          // Populate creator info
          return await Campaign.populate(results, {
            path: 'creatorId',
            select: 'name email'
          });
        }),
      Campaign.aggregate([
        { $match: query },
        { $count: 'total' }
      ]).exec()
    ]);

    const total = countResult[0]?.total || 0;

    console.log(`Found ${campaigns.length} campaigns out of ${total} total`);
    
    // Process campaign results
    const campaignsWithDetails = campaigns.map(campaign => {
      // Add default image if none exists
      if (!campaign.mediaUrls || campaign.mediaUrls.length === 0) {
        campaign.mediaUrls = [getRandomImage(campaign.category)];
      }
      
      // Calculate additional fields
      return {
        ...campaign,
        isFunded: campaign.raisedAmount >= campaign.goalAmount,
        progress: Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100),
        remainingAmount: Math.max(campaign.goalAmount - campaign.raisedAmount, 0),
        daysLeft: Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
      };
    });

    res.status(200).json({
      campaigns: campaignsWithDetails,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Error in getCampaigns:', error);
    res.status(500).json({ 
      message: 'Failed to fetch campaigns',
      error: error.message 
    });
  }
};

const getCampaignById = async (req, res) => {
  try {
    console.log('Fetching campaign details:', {
      campaignId: req.params.campaignId,
      userId: req.user?.userId
    });

    if (!mongoose.Types.ObjectId.isValid(req.params.campaignId)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findById(req.params.campaignId)
      .populate('creatorId', 'name email logoUrl')
      .populate({
        path: 'comments',
        populate: {
          path: 'userId',
          select: 'name email logoUrl'
        }
      })
      .lean();

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if the campaign is approved/completed or if the user is the owner
    const isOwner = req.user && campaign.creatorId._id.toString() === req.user.userId;
    const isApproved = campaign.status === 'approved' || campaign.status === 'completed';

    console.log('Campaign access check:', {
      campaignStatus: campaign.status,
      isOwner,
      isApproved
    });

    if (!isApproved && !isOwner) {
      return res.status(403).json({ 
        message: 'Campaign not found or awaiting approval',
        status: campaign.status 
      });
    }

    // Add default image if none exists
    if (!campaign.mediaUrls || campaign.mediaUrls.length === 0) {
      campaign.mediaUrls = [getRandomImage(campaign.category)];
    }

    // Calculate progress
    campaign.progress = ((campaign.raisedAmount || 0) / campaign.goalAmount) * 100;
    campaign.isFunded = campaign.status === 'completed' || campaign.raisedAmount >= campaign.goalAmount;

    res.status(200).json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ 
      message: 'Error fetching campaign details',
      error: error.message 
    });
  }
};

const getPendingCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'pending' })
      .populate('creatorId', 'email')
      .sort({ createdAt: -1 });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const moderateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { status },
      { new: true }
    ).populate('creatorId', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json(campaign);
  } catch (error) {
    console.error('Moderate campaign error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const donateToCampaign = async (req, res) => {
  const { campaignId } = req.params;
  const { amount } = req.body;

  try {
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid donation amount' });
    }

    // Find campaign and populate necessary fields
    const campaign = await Campaign.findById(campaignId)
      .populate('creatorId', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Only check if campaign is approved for donations
    if (campaign.status !== 'approved') {
      return res.status(400).json({ 
        message: 'Campaign is not accepting donations',
        status: campaign.status
      });
    }

    // Prevent campaign creators from donating to their own campaigns
    if (campaign.creatorId._id.toString() === req.user.userId) {
      return res.status(400).json({ 
        message: 'You cannot donate to your own campaign'
      });
    }

    // Create a new donation record
    const donation = new Donation({
      campaignId,
      userId: req.user.userId,
      amount: Number(amount)
    });

    // Save the donation first
    await donation.save();

    // Calculate total raised amount from all donations
    const totalRaised = await Donation.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const newRaisedAmount = totalRaised[0]?.total || 0;
    const newStatus = newRaisedAmount >= campaign.goalAmount ? 'completed' : 'approved';

    // Update campaign with the accurate total
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { 
        $set: { 
          raisedAmount: newRaisedAmount,
          status: newStatus
        }
      },
      { new: true }
    )
      .populate('creatorId', 'name email');

    if (!updatedCampaign) {
      throw new Error('Failed to update campaign');
    }

    // Return the updated campaign with the new donation
    res.status(200).json({
      message: 'Donation successful',
      campaign: updatedCampaign,
      donation: {
        id: donation._id,
        amount: donation.amount,
        createdAt: donation.createdAt
      }
    });
  } catch (error) {
    console.error('Error processing donation:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    // Handle other errors
    res.status(500).json({ 
      message: 'Failed to process donation. Please try again.',
      error: error.message 
    });
  }
};

const addComment = async (req, res) => {
  const { campaignId } = req.params;
  const { text } = req.body;

  try {
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const comment = new Comment({
      campaignId,
      userId: req.user.userId,
      text: text.trim()
    });

    // Save comment and update campaign atomically
    const [savedComment, updatedCampaign] = await Promise.all([
      comment.save(),
      Campaign.findByIdAndUpdate(
        campaignId,
        { $push: { comments: comment._id } },
        { 
          new: true,
          populate: [
            { path: 'creatorId', select: 'name email logoUrl' },
            { 
              path: 'comments',
              populate: {
                path: 'userId',
                select: 'name email logoUrl'
              }
            }
          ]
        }
      )
    ]);

    // Return both the comment and updated campaign
    res.status(201).json({
      message: 'Comment added successfully',
      campaign: updatedCampaign,
      comment: {
        ...savedComment.toObject(),
        userId: req.user
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is authorized to delete the comment
    if (comment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove comment from campaign's comments array
    await Campaign.findByIdAndUpdate(
      comment.campaignId,
      { $pull: { comments: commentId } }
    );

    // Delete the comment
    await comment.deleteOne();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new function to recalculate raised amounts for all campaigns
const recalculateAllCampaignAmounts = async (req, res) => {
  try {
    // Get all campaigns
    const campaigns = await Campaign.find({});
    
    // Update each campaign with correct total
    const updates = campaigns.map(async (campaign) => {
      const totalRaised = await Donation.aggregate([
        { $match: { campaignId: campaign._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const newRaisedAmount = totalRaised[0]?.total || 0;
      const newStatus = newRaisedAmount >= campaign.goalAmount ? 'completed' : campaign.status;
      
      return Campaign.findByIdAndUpdate(
        campaign._id,
        {
          $set: {
            raisedAmount: newRaisedAmount,
            status: newStatus
          }
        }
      );
    });
    
    await Promise.all(updates);
    
    res.status(200).json({ 
      message: 'All campaign amounts have been recalculated successfully' 
    });
  } catch (error) {
    console.error('Error recalculating campaign amounts:', error);
    res.status(500).json({ 
      message: 'Failed to recalculate campaign amounts',
      error: error.message 
    });
  }
};

module.exports = { 
  createCampaign, 
  getCampaigns, 
  getPendingCampaigns, 
  moderateCampaign, 
  getCampaignById, 
  donateToCampaign,
  addComment,
  deleteComment,
  recalculateAllCampaignAmounts
};