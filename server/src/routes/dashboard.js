const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { ROLES } = require('../constants');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.use(auth, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER));

router.get('/', dashboardController.getDashboard);

module.exports = router;