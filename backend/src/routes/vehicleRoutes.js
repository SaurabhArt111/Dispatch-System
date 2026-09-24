const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/vehicleController');

router.use(requireAuth);
router.get('/', ctrl.listVehicles);
router.post('/', requirePermission('vehicle:manage'), ctrl.createVehicle);
router.patch('/:id', requirePermission('vehicle:manage'), ctrl.updateVehicle);

module.exports = router;
