const { describe, it, before } = require('node:test');
const { strictEqual, ok } = require('node:assert');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5001/api';

async function get(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, body: await res.json() };
}

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

describe('live API integration (skips when server is down)', () => {
  let up = false;
  let token = '';

  before(async () => {
    try {
      const r = await get('/health');
      up = r.status === 200 && r.body.success === true;
      if (up) {
        const login = await post('/auth/login', {
          email: 'admin@example.com',
          password: 'admin123',
        });
        token = login.body.data?.token || '';
      }
    } catch {
      up = false;
    }
  });

  it('health endpoint responds', (t) => {
    if (!up) return t.skip('server not running');
    ok(up);
  });

  it('admin can login and reach the dashboard', async (t) => {
    if (!up) return t.skip('server not running');
    ok(token, 'expected an admin token');
    const dash = await get('/dashboard', token);
    strictly(dash.status, 200);
    ok(dash.body.data.kpis.totalProducts >= 0);
  });

  it('unauthenticated requests are rejected with 401', async (t) => {
    if (!up) return t.skip('server not running');
    const r = await get('/inventory');
    strictEqual(r.status, 401);
  });
});

function strictly(a, b) {
  strictEqual(a, b);
}