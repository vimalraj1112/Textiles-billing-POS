const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/respond');
const dashboardService = require('../services/dashboardService');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.dashboardData(req.query);
  return apiSuccess(res, data, 'Dashboard data');
});

module.exports = { getDashboard };