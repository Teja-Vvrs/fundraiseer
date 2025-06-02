const Contact = require('../models/Contact');

// Submit a contact message
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      userId: req.user ? req.user._id : null
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({ message: 'Error submitting contact message' });
  }
};

// Get all contacts (admin only)
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    
    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
};

// Get contact statistics (admin only)
const getContactStats = async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.countDocuments({ status: 'unread' });
    const resolvedContacts = await Contact.countDocuments({ status: 'resolved' });
    
    res.json({
      total: totalContacts,
      unread: unreadContacts,
      resolved: resolvedContacts
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({ message: 'Error fetching contact statistics' });
  }
};

// Update contact status (admin only)
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.contactId,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ message: 'Error updating contact status' });
  }
};

// Get user's messages
const getUserMessages = async (req, res) => {
  try {
    const messages = await Contact.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Get user messages error:', error);
    res.status(500).json({ message: 'Error fetching user messages' });
  }
};

module.exports = {
  submitContact,
  getContacts,
  getContactStats,
  updateContactStatus,
  getUserMessages
}; 
 