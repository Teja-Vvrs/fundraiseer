const express = require('express');
   const { makeDonation } = require('../controllers/donationController');
   const { authMiddleware } = require('../middleware/authMiddleware');
   const router = express.Router();

   router.post('/donate', authMiddleware, makeDonation);

   module.exports = router;