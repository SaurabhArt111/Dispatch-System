const router = require('express').Router();
const { requireScreenAuth } = require('../middleware/auth');
const ctrl = require('../controllers/screenController');
const { listJobsForScreen } = require('../controllers/godownJobController');

// Public: entering a pairing code does not require prior auth
router.post('/pair', ctrl.pairScreen);

router.use(requireScreenAuth);
router.get('/whoami', ctrl.whoami);
router.post('/heartbeat', ctrl.heartbeat);
router.get('/jobs', listJobsForScreen);

module.exports = router;
