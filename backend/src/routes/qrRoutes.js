const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/qrController');

router.use(requireAuth);
router.post('/roll/:rollId', requirePermission('qr:generate'), ctrl.generateQR);
router.post('/bulk', requirePermission('qr:generate'), ctrl.bulkGenerateQR);
router.post('/:id/mark-printed', requirePermission('qr:generate'), ctrl.markPrinted);
router.get('/lookup/:code', ctrl.lookupByCode);

module.exports = router;
