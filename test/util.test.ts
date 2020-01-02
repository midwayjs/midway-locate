import { safeReadJSON, safeGetProperty } from '../src/util';
import { join } from 'path';
import * as assert from 'assert';

describe('/test/util.test.ts', () => {
  it('test safe require object', async () => {
    assert(await safeReadJSON(join(__dirname, './fixtures/rx-fc')));
    assert(
      JSON.stringify(
        await safeReadJSON(join(__dirname, './fixtures/rx-fc/abc'))
      ) === '{}'
    );
  });

  it('test safe get property in null object', () => {
    let data = safeGetProperty(null, 'a');
    assert(data === null);
  });

  it('test safe get object property', () => {
    const json = {
      a: 1,
      b: {
        c: 'ddd',
        d: null,
        e: {
          f: ['b'],
        },
      },
    };

    let data = safeGetProperty(json, 'a');
    assert(data === 1);
    data = safeGetProperty(json, 'b.c');
    assert(data === 'ddd');
    data = safeGetProperty(json, 'b.d');
    assert(data === null);
    data = safeGetProperty(json, 'b.e.f');
    assert(data[0] === 'b');
  });
});
