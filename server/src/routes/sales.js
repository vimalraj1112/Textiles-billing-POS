const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const saleController = require('../controllers/saleController');
const { saleCreateSchema } = require('../validators/businessValidator');

const router = express.Router();

router.use(auth);

router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), saleController.listSales);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), validate(saleCreateSchema), saleController.createSale);
router.post('/validate-coupon', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), saleController.validateCoupon);
router.post('/hold', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), validate(saleCreateSchema), saleController.holdSale);
router.get('/held', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), async (req, res, next) => {
  try {
    const { Sale } = require('../models/Sale');
    const held = await Sale.find({ status: 'HELD' }).populate('customer', 'name phone').populate('cashier', 'name').sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, message: 'Held bills fetched', data: held });
  } catch (error) {
    next(error);
  }
});
router.post('/held/:id/complete', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), saleController.releaseHold);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), saleController.getSale);
router.get('/:id/invoice', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), saleController.getSale);
router.post('/:id/void', authorize(ROLES.ADMIN, ROLES.MANAGER), saleController.voidSale);

module.exports = router;