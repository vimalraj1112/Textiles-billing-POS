const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const purchaseController = require('../controllers/purchaseController');
const { purchaseCreateSchema } = require('../validators/businessValidator');

const router = express.Router();

router.use(auth);

router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), purchaseController.listPurchases);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), validate(purchaseCreateSchema), purchaseController.createPurchase);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), purchaseController.getPurchase);
router.post('/:id/pay', authorize(ROLES.ADMIN, ROLES.MANAGER), purchaseController.payPurchase);

module.exports = router;