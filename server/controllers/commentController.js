const Comment = require('../models/Comment');
const Campaign = require('../models/Campaign');

const postComment = async (req, res) => {
  const { campaignId, text } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'approved') {
      return res.status(400).json({ message: 'Invalid or inactive campaign' });
    }

    const comment = new Comment({
      campaignId,
      userId: req.user.userId,
      text,
    });

    await comment.save();

    campaign.comments.push(comment._id);
    await campaign.save();

    res.status(201).json(comment);
  } catch (error) {
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

    await comment.deleteOne();

    await Campaign.updateOne(
      { _id: comment.campaignId },
      { $pull: { comments: commentId } }
    );

    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const comments = await Comment.find({ campaignId })
      .populate('userId', 'email')
      .sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { postComment, deleteComment, getComments };