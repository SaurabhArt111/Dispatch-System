const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { scanRoll } = require('../controllers/scanController');

router.use(requireAuth);
router.post('/', requirePermission('qr:scan'), scanRoll);

module.exports = router;
