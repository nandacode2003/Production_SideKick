const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/', protect, ctrl.getChats);
router.get('/:chatId/messages', protect, ctrl.getMessages);
router.post('/:chatId/messages', protect, ctrl.sendMessage);

module.exports = router;
