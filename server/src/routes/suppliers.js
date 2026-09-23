const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const partyController = require('../controllers/partyController');
const { supplierSchema, supplierUpdateSchema } = require('../validators/partyValidator');

const router = express.Router();

router.use(auth);

router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), partyController.listSuppliers);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), validate(supplierSchema), partyController.createSupplier);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), partyController.getSupplier);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), validate(supplierUpdateSchema), partyController.updateSupplier);

module.exports = router;