process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '5015';

require('../../config/env').loadEnv();
const mongoose = require('mongoose');
const { assertSafeTestDatabase } = require('../test-db-guard');
const { clearBusinessData, ensureManualAccounts } = require('./helpers');

assertSafeTestDatabase();

const ctx = {
  baseUrl: `http://localhost:${process.env.PORT}`,
};

const suites = [
  ['01 academic setup', require('./01-academic-setup.test')],
  ['02 groups and topics', require('./02-groups-topics.test')],
  ['03 project milestones', require('./03-project-milestones.test')],
  ['04 extension and topic change', require('./04-extension-topic-change.test')],
];

async function main() {
  const { server, io } = require('../../app');

  try {
    await clearBusinessData();
    await ensureManualAccounts(ctx);

    for (const [label, runSuite] of suites) {
      console.log(`\n--- manual-flow: ${label} ---`);
      await runSuite(ctx);
      console.log(`ok: ${label}`);
    }

    console.log('\nManual flow test cases passed.');
  } catch (error) {
    console.error('\nManual flow test failed:', error.message);
    if (error.stack) console.error(error.stack);
    process.exitCode = 1;
  } finally {
    io.close();
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(process.exitCode || 0);
    });
  }
}

main();
