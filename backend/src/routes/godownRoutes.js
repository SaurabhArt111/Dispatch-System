const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/godownController');

router.use(requireAuth);
router.get('/', ctrl.listGodowns);
router.post('/', requirePermission('godown:manage'), ctrl.createGodown);
router.patch('/:id', requirePermission('godown:manage'), ctrl.updateGodown);
router.post('/:id/screens', requirePermission('godown:manage'), ctrl.createScreenPairing);
router.get('/screens/all', requirePermission('godown:manage'), ctrl.listScreens);

module.exports = router;
