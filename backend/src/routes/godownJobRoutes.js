const router = require('express').Router();
const { requireAuth, requireGodownAccess } = require('../middleware/auth');
const ctrl = require('../controllers/godownJobController');

router.use(requireAuth);
router.get('/', ctrl.listAllJobs);
router.get('/godown/:godownCode', requireGodownAccess('godownCode'), ctrl.listJobsForGodown);
router.post('/:id/acknowledge', ctrl.acknowledgeJob);
router.patch('/:id/status', ctrl.updateJobStatus);

module.exports = router;
