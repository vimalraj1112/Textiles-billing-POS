const { describe, it } = require('node:test');
const { strictEqual, deepStrictEqual } = require('node:assert');
const { buildPagination, paginatedResponse } = require('../src/utils/pagination');

describe('pagination utils', () => {
  it('applies default page and limit', () => {
    const { page, limit, skip } = buildPagination({});
    strictEqual(page, 1);
    strictEqual(limit, 20);
    strictEqual(skip, 0);
  });

  it('respects explicit page, limit and clamps limit', () => {
    const a = buildPagination({ page: 3, limit: 25 });
    strictEqual(a.page, 3);
    strictEqual(a.limit, 25);
    strictEqual(a.skip, 50);

    const b = buildPagination({ page: 0, limit: 999 });
    strictEqual(b.page, 1);
    strictEqual(b.limit, 200);
  });

  it('builds a paginated response envelope', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const res = paginatedResponse(items, 42, 1, 10);
    deepStrictEqual(res, {
      items: [{ id: 1 }, { id: 2 }],
      total: 42,
      page: 1,
      limit: 10,
      pages: 5,
    });
  });
});