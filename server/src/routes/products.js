const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const productController = require('../controllers/productController');
const {
  productCreateSchema,
  productUpdateSchema,
} = require('../validators/productValidator');

const router = express.Router();

router.use(auth);

router.get('/search/pos', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.STAFF), productController.searchPOS);
router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.STAFF), productController.listProducts);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), validate(productCreateSchema), productController.createProduct);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.STAFF), productController.getProduct);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), validate(productUpdateSchema), productController.updateProduct);
router.delete('/:id', authorize(ROLES.ADMIN), productController.deleteProduct);

module.exports = router;