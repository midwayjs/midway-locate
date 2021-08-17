export function includeDependencies(usingDependencies, pkgDeps): string[] {
  const result: Set<string> = new Set(usingDependencies);
  // whitelist for sequelize
  if (usingDependencies.includes('sequelize-typescript')) {
    result.add('sequelize');
  }
  // whitelist for request
  if (usingDependencies.includes('request-promise')) {
    if (pkgDeps['request']) {
      result.add('request');
    }
  }

  for (const key of Object.keys(pkgDeps)) {
    // add for egg plugin
    if (/egg/.test(key)) {
      result.add(key);
    }

    // add for midway package
    if (/midway/.test(key) && !/build-plugin-/.test(key) && !/cli-plugin-/.test(key)) {
      result.add(key);
    }

    // add for db driver
    if (inclueDBDriver(key)) {
      result.add(key);
    }
  }
  return Array.from(result);
}

export function inclueDBDriver(key) {
  return [
    'mysql',
    'mysql2',
    'pg',
    'sqlite3',
    'mssql',
    'sql.js',
    'oracledb',
    '@sap/hana-client',
    'mongodb',
    'mongoose',
  ].includes(key);
}
