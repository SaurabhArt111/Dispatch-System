const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/dcController');

router.use(requireAuth);
router.get('/', ctrl.listDCs);
router.get('/:id', ctrl.getDC);

module.exports = router;
