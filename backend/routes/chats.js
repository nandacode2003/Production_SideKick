const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getChatHistory, getMyRooms, sendMessage } = require('../controllers/eventChatController');

router.get('/rooms',      protect, getMyRooms);
router.post('/send',      protect, sendMessage);
router.get('/:roomId',    protect, getChatHistory);

module.exports = router;
