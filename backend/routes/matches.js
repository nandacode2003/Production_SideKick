const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/suggestions', protect, ctrl.getSuggestions);
router.get('/pending', protect, ctrl.getPending);
router.get('/active', protect, ctrl.getActive);
router.post('/request', protect, ctrl.sendRequest);
router.post('/:matchId/accept', protect, ctrl.acceptMatch);
router.post('/:matchId/reject', protect, ctrl.rejectMatch);

module.exports = router;
