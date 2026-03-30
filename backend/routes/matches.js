const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/suggestions', protect, ctrl.getSuggestions);
router.get('/pending',     protect, ctrl.getPending);
router.get('/active',      protect, ctrl.getActive);
router.post('/request',    protect, ctrl.sendRequest);
router.put('/respond',     protect, ctrl.respondRequest);
router.put('/cancel',      protect, ctrl.cancelRequest);

// Legacy routes
router.post('/:matchId/accept', protect, (req, res, next) => {
  req.body = { matchId: req.params.matchId, action: 'accept' };
  ctrl.respondRequest(req, res, next);
});
router.post('/:matchId/reject', protect, (req, res, next) => {
  req.body = { matchId: req.params.matchId, action: 'reject' };
  ctrl.respondRequest(req, res, next);
});

module.exports = router;
