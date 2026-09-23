const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Validation error';
    errors = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  }

  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field "${field}"`;
    errors = [{ path: field, message: `This ${field} already exists` }];
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Uploaded file is too large';
  }

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }

  if (env.NODE_ENV !== 'production') {
    if (statusCode === 500) console.error('[error]', err);
  } else {
    if (statusCode === 500) console.error('[error]', err.message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = errorHandler;