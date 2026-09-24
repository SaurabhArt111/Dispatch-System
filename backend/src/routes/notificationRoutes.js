const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.use(requireAuth);
router.get('/', ctrl.listForRoom);
router.post('/:id/read', ctrl.markRead);

module.exports = router;
