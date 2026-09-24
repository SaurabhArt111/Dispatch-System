const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/transferController');

router.use(requireAuth);
router.get('/', ctrl.listTransfers);
router.post('/', requirePermission('transfer:manage'), ctrl.requestTransfer);
router.post('/:id/mark-transferred', requirePermission('transfer:manage'), ctrl.markTransferred);
router.post('/:id/confirm-receipt', requirePermission('transfer:manage'), ctrl.confirmReceipt);

module.exports = router;
