const express = require('express');
const { postComment, deleteComment, getComments } = require('../controllers/commentController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/post', authMiddleware, postComment);
router.delete('/:commentId', authMiddleware, adminMiddleware, deleteComment);
router.get('/:campaignId', getComments);

module.exports = router;