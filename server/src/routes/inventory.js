const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { ROLES } = require('../constants');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

router.use(auth);

router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.STAFF), inventoryController.listInventory);
router.get('/movements', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), inventoryController.listMovements);
router.post('/adjust', authorize(ROLES.ADMIN, ROLES.MANAGER), inventoryController.adjustStock);
router.get('/low-stock', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), inventoryController.lowStock);

module.exports = router;