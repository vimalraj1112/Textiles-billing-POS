const apiSuccess = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const apiError = (res, statusCode, message, errors = []) =>
  res.status(statusCode).json({ success: false, message, errors });

module.exports = { apiSuccess, apiError };