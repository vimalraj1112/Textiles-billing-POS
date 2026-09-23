const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validators/authValidator');
const { login, me, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

module.exports = router;