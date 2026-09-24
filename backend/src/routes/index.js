const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/godowns', require('./godownRoutes'));
router.use('/screen', require('./screenRoutes'));
router.use('/dc', require('./dcRoutes'));
router.use('/jobs', require('./godownJobRoutes'));
router.use('/rolls', require('./rollRoutes'));
router.use('/qr', require('./qrRoutes'));
router.use('/scan', require('./scanRoutes'));
router.use('/transfers', require('./transferRoutes'));
router.use('/vehicles', require('./vehicleRoutes'));
router.use('/dispatch', require('./dispatchRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/audit', require('./auditRoutes'));
router.use('/sync', require('./syncRoutes'));
router.use('/webhooks', require('./webhookRoutes'));

module.exports = router;
