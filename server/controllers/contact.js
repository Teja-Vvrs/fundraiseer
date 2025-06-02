const Contact = require('../models/Contact');
const asyncHandler = require('express-async-handler');

// @desc    Submit a contact form
// @route   POST /api/contact
// @access  Public
const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Log the full request details
  console.log('Contact submission request:', {
    body: req.body,
    user: req.user ? {
      _id: req.user._id,
      userId: req.user.userId,
      role: req.user.role
    } : 'No user authenticated'
  });

  // Validate input
  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('Please fill in all fields');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  const contactData = {
    name,
    email,
    subject,
    message,
    status: 'unread'
  };

  // Add userId if user is authenticated
  if (req.user) {
    console.log('Adding user ID to contact:', req.user._id);
    contactData.userId = req.user._id;
  }

  console.log('Attempting to create contact with data:', contactData);

  const contact = await Contact.create(contactData);

  console.log('Created contact document:', contact);

  // Verify the contact was saved
  const savedContact = await Contact.findById(contact._id).populate('userId', 'name email');
  console.log('Verified saved contact:', savedContact);

  res.status(201).json({
    success: true,
    message: 'Contact form submitted successfully',
    contact: {
      _id: contact._id,
      name,
      email,
      subject,
      status: contact.status,
      createdAt: contact.createdAt,
      userId: contact.userId
    }
  });
});

// @desc    Get all contact submissions (admin only)
// @route   GET /api/contact/admin
// @access  Private/Admin
const getAdminContacts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;

  const query = {};
  if (status && ['unread', 'in-progress', 'resolved'].includes(status)) {
    query.status = status;
  }

  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'name email')
    .lean();

  const total = await Contact.countDocuments(query);

  res.json({
    contacts,
    page,
    totalPages: Math.ceil(total / limit),
    total
  });
});

// @desc    Get contact submission by ID (admin only)
// @route   GET /api/contact/admin/:id
// @access  Private/Admin
const getAdminContactById = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('respondedBy', 'name email')
    .lean();

  if (!contact) {
    res.status(404);
    throw new Error('Contact submission not found');
  }

  res.json(contact);
});

// @desc    Update contact status and response (admin only)
// @route   PUT /api/contact/admin/:id
// @access  Private/Admin
const updateContactStatus = asyncHandler(async (req, res) => {
  const { status, adminResponse } = req.body;
  console.log('Updating contact status:', {
    contactId: req.params.id,
    newStatus: status,
    hasAdminResponse: !!adminResponse
  });

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    res.status(404);
    throw new Error('Contact submission not found');
  }

  if (status && !['unread', 'in-progress', 'resolved'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  contact.status = status || contact.status;
  if (adminResponse) {
    contact.adminResponse = adminResponse;
    contact.respondedBy = req.user._id;
    contact.respondedAt = new Date();
  }

  const updatedContact = await contact.save();
  console.log('Contact updated:', {
    id: updatedContact._id,
    newStatus: updatedContact.status,
    hasResponse: !!updatedContact.adminResponse
  });
  
  const populatedContact = await Contact.findById(updatedContact._id)
    .populate('userId', 'name email')
    .populate('respondedBy', 'name email')
    .lean();

  res.json(populatedContact);
});

// @desc    Get contact statistics (admin only)
// @route   GET /api/contact/admin/stats
// @access  Private/Admin
const getContactStats = asyncHandler(async (req, res) => {
  const stats = await Contact.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const formattedStats = {
    unread: 0,
    'in-progress': 0,
    resolved: 0,
    total: 0
  };

  stats.forEach(stat => {
    formattedStats[stat._id] = stat.count;
    formattedStats.total += stat.count;
  });

  res.json(formattedStats);
});

// @desc    Get user's contact messages
// @route   GET /api/contact/user/messages
// @access  Private
const getUserMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  console.log('Get user messages request:', {
    userId: req.user._id,
    page,
    limit
  });

  try {
    const query = { userId: req.user._id };
    
    // Get total count for this user
    const total = await Contact.countDocuments(query);
    console.log('Total messages for this user:', total);

    // Get paginated messages with proper sorting
    const messages = await Contact.find(query)
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .lean();

    console.log('Found messages:', {
      count: messages.length,
      messageStatuses: messages.map(m => ({
        id: m._id,
        subject: m.subject,
        status: m.status,
        hasResponse: !!m.adminResponse
      }))
    });

    // Format messages with all necessary fields
    const formattedMessages = messages.map(message => ({
      ...message,
      respondedAt: message.respondedAt || null,
      adminResponse: message.adminResponse || null,
      status: message.status || 'unread',
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    }));

    // Sort messages by status priority and date
    const sortedMessages = formattedMessages.sort((a, b) => {
      // First sort by status priority
      const statusPriority = {
        'in-progress': 0,
        'unread': 1,
        'resolved': 2
      };
      
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort by date, newest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Apply pagination after sorting
    const startIndex = (page - 1) * limit;
    const paginatedMessages = sortedMessages.slice(startIndex, startIndex + limit);

    const response = {
      messages: paginatedMessages,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      hasUnread: sortedMessages.some(m => m.status === 'unread'),
      hasInProgress: sortedMessages.some(m => m.status === 'in-progress')
    };

    console.log('Sending response:', {
      messageCount: response.messages.length,
      page: response.page,
      totalPages: response.totalPages,
      total: response.total,
      hasUnread: response.hasUnread,
      hasInProgress: response.hasInProgress
    });

    res.json(response);
  } catch (error) {
    console.error('Error in getUserMessages:', error);
    res.status(500).json({
      message: 'Error fetching user messages',
      error: error.message
    });
  }
});

module.exports = {
  submitContact,
  getAdminContacts,
  getAdminContactById,
  updateContactStatus,
  getContactStats,
  getUserMessages
}; 