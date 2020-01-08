import {
  findDependenciesByAST as detective,
  safeGetProperty,
  safeReadJSON,
} from '../src/util';
import { join } from 'path';
import * as assert from 'assert';
import { deepEqual } from 'assert';
import { readFileSync } from 'fs';

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

  describe('detective case', () => {
    describe('konan case', () => {
      const input = readFileSync(
        join(__dirname, './fixtures/detective_case/fixture.js'),
        'utf8'
      );

      it('all', () => {
        deepEqual(detective(input), [
          'foo',
          'vue/dist/vue',
          'wow',
          'baby',
          './async-module',
        ]);
      });

      it('dynamical require', () => {
        deepEqual(
          detective(`
      require(path.resolve('./'))
      require('bar')
    `),
          ['bar']
        );
      });

      it('only consider require as function', () => {
        deepEqual(
          detective(`
      require('foo')
      var a = {
        require: 'bar'
      }
    `),
          ['foo']
        );
      });

      it('import *', () => {
        deepEqual(
          detective(`import * as m from 'm';var foo = {import: 'mm'}`),
          ['m']
        );
      });

      it('export', () => {
        const input = readFileSync(
          join(__dirname, './fixtures/detective_case/fixture-export.js'),
          'utf8'
        );
        deepEqual(detective(input), [
          './util',
          './temporary',
          './persistent',
          'all',
        ]);
      });
    });

    describe('custom case', () => {
      it('should analyze ts file', () => {
        const input = readFileSync(
          join(__dirname, './fixtures/detective_case/fixture.ts'),
          'utf8'
        );
        deepEqual(detective(input), ['midway']);
      });
    });
  });
});
