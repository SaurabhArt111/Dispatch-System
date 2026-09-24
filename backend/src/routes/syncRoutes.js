const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/syncController');

router.use(requireAuth, requirePermission('sync:read'));
router.get('/', ctrl.listSyncLogs);
router.post('/trigger-mock', requirePermission('sync:manage'), ctrl.triggerMockDC);

module.exports = router;
