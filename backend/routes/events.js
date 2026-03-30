const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createEvent, getEvents, joinEvent, getMyEvents, deleteEvent } = require('../controllers/eventChatController');

router.get('/',           protect, getEvents);
router.post('/',          protect, createEvent);
router.get('/mine',       protect, getMyEvents);
router.post('/:id/join',  protect, joinEvent);
router.delete('/:id',     protect, deleteEvent);

module.exports = router;
