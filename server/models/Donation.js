const mongoose = require('mongoose');

   const donationSchema = new mongoose.Schema({
     campaignId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Campaign',
       required: true,
     },
     userId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: true,
     },
     amount: {
       type: Number,
       required: true,
       min: 1,
     },
     createdAt: {
       type: Date,
       default: Date.now,
     },
   });

   module.exports = mongoose.model('Donation', donationSchema);