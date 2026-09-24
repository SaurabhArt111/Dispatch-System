const router = require('express').Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.use(requireAuth);
router.get('/', requirePermission('user:manage'), ctrl.listUsers);
router.get('/roles', ctrl.listRoles);
router.post('/', requirePermission('user:manage'), ctrl.createUser);
router.patch('/:id', requirePermission('user:manage'), ctrl.updateUser);
router.post('/:id/reset-password', requirePermission('user:manage'), ctrl.resetPassword);
router.post('/:id/force-logout', requirePermission('user:manage'), ctrl.forceLogout);
router.get('/:id/sessions', requirePermission('user:manage'), ctrl.listSessions);
router.post('/sessions/:sessionId/revoke', requirePermission('user:manage'), ctrl.revokeSession);

module.exports = router;
