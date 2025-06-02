const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['education', 'medical', 'environment', 'technology', 'community', 'other']
  },
  goalAmount: {
    type: Number,
    required: [true, 'Goal amount is required'],
    min: [1, 'Goal amount must be greater than 0']
  },
  raisedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fundUtilizationPlan: {
    title: String,
    description: String,
    timeline: String,
    budget: Number
  },
  progressUpdates: [{
    title: String,
    description: String,
    mediaUrls: [String],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  mediaUrls: [{
    type: String
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Add a method to check and update the campaign status
campaignSchema.methods.checkAndUpdateStatus = async function() {
  if (this.status === 'approved' && this.raisedAmount >= this.goalAmount) {
    this.status = 'completed';
    await this.save();
  }
  return this;
};

// Add a pre-save middleware to check status
campaignSchema.pre('save', function(next) {
  if (this.status === 'approved' && this.raisedAmount >= this.goalAmount) {
    this.status = 'completed';
  }
  next();
});

// Add indexes for better query performance
campaignSchema.index({ status: 1, createdAt: -1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ creatorId: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);