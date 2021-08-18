import { ProjectType, Locator } from '../src';
import { join } from 'path';
import * as assert from 'assert';

async function assertNotThrowsAsync(fn, err?, msg?) {
  let f = () => {};
  try {
    await fn();
  } catch (e) {
    f = () => {
      throw e;
    };
  } finally {
    assert.doesNotThrow(f, err, msg);
  }
}

describe('/test/index.test.ts', () => {
  it('locate in egg project', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/egg-base'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/egg-base'));
    assert(!result.midwayRoot);
    assert(!result.tsCodeRoot);
    assert(!result.tsConfigFilePath);
    assert(!result.tsBuildRoot);
    assert(!result.usingDependencies);
    assert(!result.usingDependenciesVersion);
    assert(result.integrationProject === false);
    assert(result.projectType === ProjectType.UNKNOWN);
  });
  it('locate in midway base project', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/midway-base'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/midway-base'));
    assert(result.midwayRoot === join(__dirname, 'fixtures/midway-base'));
    assert(
      result.tsCodeRoot ===
        join(__dirname, 'fixtures/midway-base/src/app/controller')
    );
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/midway-base/tsconfig.json')
    );
    assert(result.tsBuildRoot === join(__dirname, 'fixtures/midway-base/dist'));
    assert.deepEqual(result.usingDependencies, ['midway']);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: { midway: '1' },
      unValid: [],
    });
    assert(result.integrationProject === false);
    assert(result.projectType === ProjectType.MIDWAY);
  });
  it('locate in midway+antd project', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/midway-all'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/midway-all'));
    assert(result.midwayRoot === join(__dirname, 'fixtures/midway-all/server'));
    assert(
      result.tsCodeRoot === join(__dirname, 'fixtures/midway-all/server/src')
    );
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/midway-all/server/tsconfig.json')
    );
    assert(
      result.tsBuildRoot === join(__dirname, 'fixtures/midway-all/server/dist')
    );
    assert(result.integrationProject === false);
    assert(result.projectType === ProjectType.MIDWAY_FRONT_MONOREPO);
    assert.deepEqual(result.usingDependencies, [
      'egg-view-assets',
      'egg-view-nunjucks',
      'midway',
    ]);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: {
        'egg-view-assets': '^1.5.0',
        'egg-view-nunjucks': '^2.2.0',
        midway: '^1.0.0',
      },
      unValid: [],
    });
  });
  it('locate in rax+faas project', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/rax-fc'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/rax-fc'));
    assert(result.midwayRoot === join(__dirname, 'fixtures/rax-fc'));
    assert(
      result.tsCodeRoot === join(__dirname, 'fixtures/rax-fc', 'src/apis')
    );
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/rax-fc/tsconfig.json')
    );
    assert(result.tsBuildRoot === join(__dirname, 'fixtures/rax-fc/dist'));
    assert.deepEqual(result.usingDependencies, [
      '@midwayjs/faas',
      '@midwayjs/abc',
      'abc',
      'foo',
      'vue',
      'wow',
      'all',
      'baby',
      '@midwayjs/test-module',
      '@midway/fake',
    ]);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: { '@midwayjs/faas': '*' },
      unValid: [
        '@midwayjs/abc',
        'abc',
        'foo',
        'vue',
        'wow',
        'all',
        'baby',
        '@midwayjs/test-module',
        '@midway/fake',
      ],
    });
    assert(result.integrationProject === true);
    assert(result.projectType === ProjectType.MIDWAY_FAAS_FRONT_integration);
  });

  it('locate in rax+faas with inner tsconfig project', async () => {
    const locator = new Locator(
      join(__dirname, 'fixtures/rax-fc-inner-config')
    );
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/rax-fc-inner-config'));
    assert(
      result.midwayRoot === join(__dirname, 'fixtures/rax-fc-inner-config')
    );
    assert(
      result.tsCodeRoot ===
        join(__dirname, 'fixtures/rax-fc-inner-config', 'src/apis')
    );
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/rax-fc-inner-config/src/apis/tsconfig.json')
    );
    assert(
      result.tsBuildRoot ===
        join(__dirname, 'fixtures/rax-fc-inner-config/src/apis/dist')
    );

    assert.deepEqual(result.usingDependencies, ['@midwayjs/faas']);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: { '@midwayjs/faas': '*' },
      unValid: [],
    });
    assert(result.integrationProject === true);
    assert(result.projectType === ProjectType.MIDWAY_FAAS_FRONT_integration);
  });

  it('should locate in midway faas + rax with monorepo', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/midway-faas-one'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/midway-faas-one'));
    assert(
      result.midwayRoot === join(__dirname, 'fixtures/midway-faas-one/cloud')
    );
    assert(
      result.tsCodeRoot ===
        join(__dirname, 'fixtures/midway-faas-one/cloud/src')
    );
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/midway-faas-one/cloud/tsconfig.json')
    );
    assert(
      result.tsBuildRoot ===
        join(__dirname, 'fixtures/midway-faas-one/cloud/dist')
    );
    assert.deepEqual(result.usingDependencies, [
      '@ali/midway-faas',
      'request',
      'request-promise',
    ]);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: {
        '@ali/midway-faas': '^2.4.14',
        request: '^2.88.0',
        'request-promise': '^4.2.5',
      },
      unValid: [],
    });
    assert(result.integrationProject === false);
    assert(result.projectType === ProjectType.MIDWAY_FAAS_FRONT_MONOREPO);
  });

  it('should locate in midway faas with ice typescript', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/ice-faas-ts'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/ice-faas-ts'));
    assert(result.midwayRoot === join(__dirname, 'fixtures/ice-faas-ts'));
    assert(result.tsCodeRoot === join(__dirname, 'fixtures/ice-faas-ts/src'));
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/ice-faas-ts/tsconfig.json')
    );
    assert(
      result.tsBuildRoot === join(__dirname, 'fixtures/ice-faas-ts/build')
    );
    assert.deepEqual(result.usingDependencies, ['@ali/midway-faas']);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: {
        '@ali/midway-faas': '^2.10.14',
      },
      unValid: [],
    });
    assert(result.integrationProject === true);
    assert(result.projectType === ProjectType.MIDWAY_FAAS_FRONT_integration);
  });

  it('should locate in midway faas by options', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/ice-faas-ts'));
    const result = await locator.run({
      tsCodeRoot: join(__dirname, 'fixtures/ice-faas-ts/src/apis'),
      tsBuildRoot: join(__dirname, 'fixtures/ice-faas-ts/build/faas'),
    });
    assert(result.cwd === join(__dirname, 'fixtures/ice-faas-ts'));
    assert(result.midwayRoot === join(__dirname, 'fixtures/ice-faas-ts'));
    assert(
      result.tsCodeRoot === join(__dirname, 'fixtures/ice-faas-ts/src/apis')
    );
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/ice-faas-ts/tsconfig.json')
    );
    assert(
      result.tsBuildRoot === join(__dirname, 'fixtures/ice-faas-ts/build/faas')
    );
    assert.deepEqual(result.usingDependencies, ['@ali/midway-faas']);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: {
        '@ali/midway-faas': '^2.10.14',
      },
      unValid: [],
    });
    assert(result.integrationProject === true);
    assert(result.projectType === ProjectType.MIDWAY_FAAS_FRONT_integration);
  });

  it('should locate in midway faas by packages', async () => {
    const locator = new Locator(
      join(__dirname, 'fixtures/ice-faas-ts-pkg-options')
    );
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/ice-faas-ts-pkg-options'));
    assert(
      result.midwayRoot === join(__dirname, 'fixtures/ice-faas-ts-pkg-options')
    );
    assert(
      result.tsCodeRoot ===
        join(__dirname, 'fixtures/ice-faas-ts-pkg-options/src/apis')
    );
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/ice-faas-ts-pkg-options/tsconfig.json')
    );
    assert(
      result.tsBuildRoot ===
        join(__dirname, 'fixtures/ice-faas-ts-pkg-options/build/faas')
    );
    assert.deepEqual(result.usingDependencies, ['@ali/midway-faas']);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: {
        '@ali/midway-faas': '^2.10.14',
      },
      unValid: [],
    });
    assert(result.integrationProject === true);
    assert(result.projectType === ProjectType.MIDWAY_FAAS_FRONT_integration);
  });

  it('should survive through malicious cylic symlinks', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/cylic-symlinks'));
    const result = await locator.run();
    assert.strictEqual(result.cwd, join(__dirname, 'fixtures/cylic-symlinks'));
    assert(!result.midwayRoot);
    assert(!result.tsCodeRoot);
    assert(!result.tsConfigFilePath);
    assert(!result.tsBuildRoot);
    assert(!result.usingDependencies);
    assert(!result.usingDependenciesVersion);
    assert(result.integrationProject === false);
    assert(result.projectType === ProjectType.UNKNOWN);
  });

  it('locate in midway base project with deep3', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/midway-base-deep-3'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/midway-base-deep-3'));
    assert(result.midwayRoot === undefined);
    assert(result.tsCodeRoot === undefined);
    assert(result.tsConfigFilePath === undefined);
    assert(result.tsBuildRoot === undefined);
    assert(result.usingDependencies === undefined);
    assert(result.usingDependenciesVersion === undefined);
    assert(result.integrationProject === false);
    assert(result.projectType === ProjectType.UNKNOWN);
  });

  it('locate in rax+faas with inner tsconfig by wrong path', async () => {
    const locator = new Locator(
      join(__dirname, 'fixtures/rax-fc-inner-wrong-path-config')
    );
    const result = await locator.run();
    assert(
      result.cwd === join(__dirname, 'fixtures/rax-fc-inner-wrong-path-config')
    );
    assert(
      result.midwayRoot ===
        join(__dirname, 'fixtures/rax-fc-inner-wrong-path-config')
    );
    assert(
      result.tsCodeRoot ===
        join(__dirname, 'fixtures/rax-fc-inner-wrong-path-config', 'src/apis')
    );
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/rax-fc-inner-wrong-path-config/tsconfig.json')
    );
    assert(
      result.tsBuildRoot ===
        join(__dirname, 'fixtures/rax-fc-inner-wrong-path-config/dist')
    );

    assert.deepEqual(result.usingDependencies, ['@midwayjs/faas']);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: { '@midwayjs/faas': '*' },
      unValid: [],
    });
    assert(result.integrationProject === true);
    assert(result.projectType === ProjectType.MIDWAY_FAAS_FRONT_integration);
  });

  it('locate in project with error file', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/midway-error-file'));
    await assertNotThrowsAsync(async () => {
      await locator.run({
        tsCodeRoot: join(__dirname, 'fixtures/midway-error-file/src/apis'),
        tsBuildRoot: join(__dirname, 'fixtures/midway-error-file/build/faas'),
      });
    });
  });

  it('locate in rax+faas project and use sequelize-typescript', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/rax-fc-sequelize'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/rax-fc-sequelize'));
    assert(result.midwayRoot === join(__dirname, 'fixtures/rax-fc-sequelize'));
    assert(
      result.tsCodeRoot ===
        join(__dirname, 'fixtures/rax-fc-sequelize', 'src/apis')
    );
    assert.deepEqual(result.usingDependencies, [
      '@midwayjs/faas',
      'sequelize-typescript',
      'request-promise',
      '@midwayjs/abc',
      'abc',
      'foo',
      'vue',
      'wow',
      'all',
      'baby',
      '@midwayjs/test-module',
      '@midway/fake',
      'sequelize',
      'request',
      'mysql2',
      'egg-mysql',
    ]);
    assert.deepEqual(result.usingDependenciesVersion, {
      valid: {
        '@midwayjs/faas': '*',
        'egg-mysql': '*',
        mysql2: '^2.1.0',
        request: '*',
        'request-promise': '*',
        sequelize: '^5.21.10',
        'sequelize-typescript': '^1.1.0',
      },
      unValid: [
        '@midwayjs/abc',
        'abc',
        'foo',
        'vue',
        'wow',
        'all',
        'baby',
        '@midwayjs/test-module',
        '@midway/fake',
      ],
    });
    assert(result.integrationProject === true);
    assert(result.projectType === ProjectType.MIDWAY_FAAS_FRONT_integration);
  });
});
