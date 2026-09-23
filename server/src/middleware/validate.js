const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    req[source] = parsed;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(new ApiError(422, 'Validation failed', errors));
    }
    return next(error);
  }
};

module.exports = validate;