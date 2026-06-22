const assertSafeTestDatabase = () => {
  if (process.env.ALLOW_MUTATING_NON_TEST_DB === 'true') {
    return;
  }

  const uri = process.env.MONGODB_URI || '';
  let databaseName = '';

  try {
    databaseName = new URL(uri).pathname.replace(/^\//, '').split('?')[0];
  } catch (error) {
    databaseName = '';
  }

  const looksLikeTestDb = /(^|[-_])(test|testing|dev|local)($|[-_])/i.test(databaseName);
  if (looksLikeTestDb) {
    return;
  }

  throw new Error(
    [
      'Refusing to run mutating integration tests on a non-test database.',
      'Use a database name containing test/dev/local, or set ALLOW_MUTATING_NON_TEST_DB=true intentionally.',
    ].join('\n')
  );
};

module.exports = { assertSafeTestDatabase };
