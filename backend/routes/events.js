const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.get('/my/created', protect, ctrl.getMyCreated);
router.get('/my/joined', protect, ctrl.getMyJoined);
router.get('/', protect, ctrl.getEvents);
router.post('/', protect, ctrl.createEvent);
router.get('/:id', protect, ctrl.getEventById);
router.post('/:id/join', protect, ctrl.joinEvent);
router.post('/:id/leave', protect, ctrl.leaveEvent);
router.delete('/:id', protect, ctrl.deleteEvent);

module.exports = router;
