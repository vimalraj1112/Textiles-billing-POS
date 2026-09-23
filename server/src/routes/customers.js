const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const partyController = require('../controllers/partyController');
const {
  customerSchema,
  customerUpdateSchema,
  supplierSchema,
  supplierUpdateSchema,
} = require('../validators/partyValidator');

const router = express.Router();

router.use(auth);

router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), partyController.listCustomers);
router.get('/search', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), async (req, res, next) => {
  try {
    const PartyService = require('../services/partyService');
    const items = await PartyService.searchCustomers(req.query.q);
    res.json({ success: true, message: 'Customers fetched', data: items });
  } catch (error) {
    next(error);
  }
});
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), validate(customerSchema), partyController.createCustomer);
router.post('/quick', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), partyController.quickCreateCustomer);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), partyController.getCustomer);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), validate(customerUpdateSchema), partyController.updateCustomer);

module.exports = router;