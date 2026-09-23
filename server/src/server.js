const connectDB = require('./config/db');
const env = require('./config/env');

async function start() {
  await connectDB();
  const { ensureDefaults } = require('./config/bootstrap');
  await ensureDefaults();
  const app = require('./app');
  app.listen(env.SERVER_PORT, () => {
    console.log(`[server] Mathi Collections API running on http://localhost:${env.SERVER_PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[server] unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[server] uncaught exception:', err);
});