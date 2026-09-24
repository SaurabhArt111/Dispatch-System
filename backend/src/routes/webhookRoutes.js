const router = require('express').Router();
const { receiveDC } = require('../controllers/webhookController');

// Public endpoint (secured via HMAC signature, not user auth) -- this is how System 1 pushes DCs in
router.post('/system1/dc', receiveDC);

module.exports = router;
