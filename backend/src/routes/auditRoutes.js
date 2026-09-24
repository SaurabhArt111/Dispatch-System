const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { listAuditLogs } = require('../controllers/auditController');

router.use(requireAuth, requirePermission('audit:read'));
router.get('/', listAuditLogs);

module.exports = router;
