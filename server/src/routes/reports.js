const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { ROLES } = require('../constants');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.use(auth, authorize(ROLES.ADMIN, ROLES.MANAGER));

router.get('/sales', reportController.salesReport);
router.get('/products', reportController.productReport);
router.get('/categories', reportController.categoryReport);
router.get('/payments', reportController.paymentReport);
router.get('/profit', reportController.profitReport);
router.get('/expenses', reportController.expenseReport);
router.get('/stock-value', reportController.stockValue);

module.exports = router;