export function includeDependencies(usingDependencies, pkgDeps) {
  // whitelist for sequelize
  if (usingDependencies.includes('sequelize-typescript')) {
    usingDependencies.push('sequelize');
  }
  // whitelist for request
  if (usingDependencies.includes('request-promise')) {
    if (pkgDeps['request']) {
      usingDependencies.push('request');
    }
  }

  for (const key of Object.keys(usingDependencies)) {
    // add for egg plugin
    if (/egg/.test(key)) {
      usingDependencies.push(key);
    }

    // add for midway package
    if (/midway/.test(key)) {
      usingDependencies.push(key);
    }

    // add for db driver
    if (inclueDBDriver(key)) {
      usingDependencies.push(key);
    }
  }
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
  ].includes(key);
}
