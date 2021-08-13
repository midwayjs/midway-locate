import {
  findDependenciesByAST as detective,
  safeGetProperty,
  safeReadJSON,
  findCommonDir,
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
        deepEqual(detective(input, true), [
          'foo',
          'vue/dist/vue',
          'wow',
          './async-module',
          'baby',
        ]);
      });

      it('dynamical require', () => {
        deepEqual(
          detective(`
      require(path.resolve('./'))
      require ('bar')
    `),
          ['bar']
        );
      });

      it('dynamical require', () => {
        deepEqual(
          detective(`
      import 'modA';
      import modB, { b as modBb } from 'modB';
      import * as modC from 'modC';
      import ("modD") import('modD2')
      import { export1 , export2 as alias2 , [...] } from "modE";
      require ('modF');require("modG");require
      ('modH')
      require('modI')
      notrequire('modJ')
    `),
          [
            'modB',
            'modC',
            'modE',
            'modD',
            'modD2',
            'modA',
            'modF',
            'modG',
            'modH',
            'modI',
          ]
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

      it('should analyze jsx file without syntax error', () => {
        const input = readFileSync(
          join(__dirname, './fixtures/detective_case/jsx.jsx'),
          'utf8'
        );
        deepEqual(detective(input, true), ['midway']);
      });

      it('should analyze tsx file without syntax error', () => {
        const input = readFileSync(
          join(__dirname, './fixtures/detective_case/tsx.tsx'),
          'utf8'
        );
        deepEqual(detective(input, true), ['midway']);
      });

      it('should analyze ts file without syntax error', () => {
        const input = readFileSync(
          join(__dirname, './fixtures/detective_case/type-assert.ts'),
          'utf8'
        );
        deepEqual(detective(input), ['midway']);
      });
    });
  });

  describe('findCommonDir', () => {
    it('empty', () => {
      const common = findCommonDir([]);
      assert(common === '');
    });
    it('different dirname', () => {
      const common = findCommonDir([
        '/src',
        '/srcxxx',
      ]);
      assert(common === '');
    });
    it('common prefix', () => {
      const common = findCommonDir([
        '/src/',
        '/src/xxx',
      ]);
      assert(common === '/src');
    });
    it('common prefix multi level', () => {
      const common = findCommonDir([
        '/projects/myapp/src/util/one.js',
        '/projects/myapp/test/fixtures/two.js',
      ]);
      assert(common === '/projects/myapp');
    });
    it('common prefix multi level not root', () => {
      const common = findCommonDir([
        'projects/myapp/src/util/one.js',
        'projects/myapp/test/fixtures/two.js',
      ]);
      assert(common === 'projects/myapp');
    });

    it('common prefix multi level in windows', () => {
      const common = findCommonDir([
        'C:\\lib\\hash.js',
        'C:\\lib\\encode\\url.js',
      ]);
      assert(common === 'C:\\lib');
    });

    it('one file', () => {
      const common = findCommonDir(['/src/apis/index.ts']);
      assert(common === '/src/apis');
    });
    it('two root file', () => {
      const common = findCommonDir(['a.ts', 'b.ts']);
      assert(common === '');
    });
    it('two different dir file', () => {
      const common = findCommonDir(['src/a.ts', 'apis/b.ts']);
      assert(common === '');
    });
    it('two same dir file', () => {
      const common = findCommonDir(['src/a.ts', 'src/b.ts']);
      assert(common === 'src');
    });
    it('two different dir level file', () => {
      const common = findCommonDir(['src/apis/a.ts', 'src/apis/other/b.ts']);
      assert(common === 'src/apis');
    });
  });
});
