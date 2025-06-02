const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');

const makeDonation = async (req, res) => {
  const { campaignId, amount } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'approved') {
      return res.status(400).json({ message: 'Invalid or inactive campaign' });
    }

    // Prevent campaign creators from donating to their own campaigns
    if (campaign.creatorId.toString() === req.user.userId) {
      return res.status(400).json({ message: 'You cannot donate to your own campaign' });
    }

    if (new Date(campaign.deadline) < new Date()) {
      return res.status(400).json({ message: 'Campaign has expired' });
    }

    // Validate donation amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid donation amount' });
    }

    const donation = new Donation({
      campaignId,
      userId: req.user.userId,
      amount,
    });

    await donation.save();

    // Update campaign's raised amount
    campaign.raisedAmount += amount;
    if (campaign.raisedAmount >= campaign.goalAmount) {
      campaign.status = 'completed';
    }
    await campaign.save();

    res.status(201).json(donation);
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { makeDonation };