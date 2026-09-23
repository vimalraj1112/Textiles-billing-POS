const buildPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const paginatedResponse = (items, total, page, limit) => {
  const pages = Math.ceil(total / limit) || 1;
  return {
    items,
    total,
    page,
    limit,
    pages,
  };
};

module.exports = { buildPagination, paginatedResponse };