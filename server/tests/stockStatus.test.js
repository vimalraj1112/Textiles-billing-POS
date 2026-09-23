const { describe, it } = require('node:test');
const { strictEqual } = require('node:assert');
const inventoryService = require('../src/services/inventoryService');

describe('inventory stock status', () => {
  it('reports OUT_OF_STOCK for zero stock', async () => {
    strictEqual(await inventoryService.getStockStatus(0, 5), 'OUT_OF_STOCK');
  });

  it('reports LOW_STOCK at or below minimum', async () => {
    strictEqual(await inventoryService.getStockStatus(5, 5), 'LOW_STOCK');
    strictEqual(await inventoryService.getStockStatus(3, 5), 'LOW_STOCK');
  });

  it('reports IN_STOCK above minimum', async () => {
    strictEqual(await inventoryService.getStockStatus(6, 5), 'IN_STOCK');
    strictEqual(await inventoryService.getStockStatus(500, 10), 'IN_STOCK');
  });
});