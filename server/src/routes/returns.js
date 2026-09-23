const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const returnController = require('../controllers/returnController');
const { salesReturnSchema, purchaseReturnSchema } = require('../validators/businessValidator');

const router = express.Router();

router.use(auth);

router.get('/sales', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), returnController.listSalesReturns);
router.get('/purchases', authorize(ROLES.ADMIN, ROLES.MANAGER), returnController.listPurchaseReturns);
router.post('/sales', authorize(ROLES.ADMIN, ROLES.MANAGER), validate(salesReturnSchema), returnController.createSalesReturn);
router.post('/purchases', authorize(ROLES.ADMIN, ROLES.MANAGER), validate(purchaseReturnSchema), returnController.createPurchaseReturn);
router.get('/sale/:saleId', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), returnController.validateReturnable);

module.exports = router;