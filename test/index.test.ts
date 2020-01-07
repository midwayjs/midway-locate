import { Locator } from '../src';
import { join } from 'path';
import * as assert from 'assert';

describe('/test/index.test.ts', () => {
  it('locate in egg project', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/egg-base'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/egg-base'));
    assert(!result.midwayRoot);
    assert(!result.tsCodeRoot);
    assert(!result.tsConfigFilePath);
    assert(!result.tsBuildRoot);
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
  });
  it('locate in rax+faas project', async () => {
    const locator = new Locator(join(__dirname, 'fixtures/rax-fc'));
    const result = await locator.run();
    assert(result.cwd === join(__dirname, 'fixtures/rax-fc'));
    assert(result.midwayRoot === join(__dirname, 'fixtures/rax-fc'));
    assert(result.tsCodeRoot === join(__dirname, 'fixtures/rax-fc', 'src/api'));
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/rax-fc/tsconfig.json')
    );
    assert(result.tsBuildRoot === join(__dirname, 'fixtures/rax-fc/dist'));
    assert(
      JSON.stringify(result.usingDependencies) ===
        JSON.stringify([
          '@midwayjs/faas',
          '@midwayjs/abc',
          'abc',
          'foo',
          'vue',
          'wow',
          'all',
          'baby',
          '@midway/fake',
          '@midwayjs/test-module',
        ])
    );
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
        join(__dirname, 'fixtures/rax-fc-inner-config', 'src/api')
    );
    assert(
      result.tsConfigFilePath ===
        join(__dirname, 'fixtures/rax-fc-inner-config/src/api/tsconfig.json')
    );
    assert(
      result.tsBuildRoot ===
        join(__dirname, 'fixtures/rax-fc-inner-config/src/api/dist')
    );
  });
});
