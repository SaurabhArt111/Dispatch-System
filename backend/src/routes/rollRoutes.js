const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/rollController');

router.use(requireAuth);
router.post('/', requirePermission('roll:manage'), ctrl.createRolls);
router.get('/job/:jobId', ctrl.listRollsForJob);
router.post('/job/:jobId/mark-packed', requirePermission('packing:manage'), ctrl.markPacked);

module.exports = router;
