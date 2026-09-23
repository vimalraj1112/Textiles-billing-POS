const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const { controllerFor } = require('../controllers/masterController');
const { categorySchema, brandSchema, sizeSchema, colorSchema } = require('../validators/masterValidator');

const router = express.Router();

router.use(auth);

const define = (base, type, schema) => {
  const c = controllerFor(type);
  router.get(base, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.STAFF), c.list);
  router.get(`${base}/all`, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.STAFF), c.all);
  router.get(`${base}/:id`, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), c.getOne);
  router.post(base, authorize(ROLES.ADMIN, ROLES.MANAGER), validate(schema), c.create);
  router.put(`${base}/:id`, authorize(ROLES.ADMIN, ROLES.MANAGER), validate(schema.partial()), c.update);
  router.delete(`${base}/:id`, authorize(ROLES.ADMIN), c.remove);
};

define('/categories', 'category', categorySchema);
define('/brands', 'brand', brandSchema);
define('/sizes', 'size', sizeSchema);
define('/colors', 'color', colorSchema);

module.exports = router;