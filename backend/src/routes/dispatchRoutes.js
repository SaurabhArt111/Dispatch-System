const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/dispatchController');

router.use(requireAuth);
router.get('/board', ctrl.getBoard);
router.get('/', ctrl.listDispatches);
router.post('/start-loading', requirePermission('dispatch:manage'), ctrl.startLoading);
router.post('/:id/scan', requirePermission('dispatch:manage'), ctrl.scanIntoLoad);
router.post('/:id/confirm-loaded', requirePermission('dispatch:manage'), ctrl.confirmLoaded);
router.post('/:id/dispatch', requirePermission('dispatch:manage'), ctrl.markDispatched);

module.exports = router;
