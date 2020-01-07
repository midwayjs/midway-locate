import { join } from 'path';
import { readFileSync } from 'fs';
import { deepEqual } from 'assert';
import { findDependencies } from '../src/util';

describe.only('/test/detective_reg.test.ts', () => {
  describe('konan case', () => {
    const input = readFileSync(join(__dirname, './fixtures/detective_case/fixture.js'), 'utf8');

    it.only('all', () => {
      deepEqual(findDependencies(input), ['foo', 'vue/dist/vue', 'wow', 'baby', './async-module']);
    });

    it('exclude dynamical import', () => {
      deepEqual(findDependencies(input), ['foo', 'vue/dist/vue', 'wow', 'baby']);
    });

    it('dynamical require', () => {
      deepEqual(
        findDependencies(`
      require(path.resolve('./'))
      require('bar')
    `)
        , {
          strings: ['bar'],
          expressions: ["path.resolve('./')"]
        })
    });

    it('only consider require as function', () => {
      deepEqual(
        findDependencies(`
      require('foo')
      var a = {
        require: 'bar'
      }
    `)
      ,{
        strings: ['foo'],
        expressions: []
      })
    });

    it('import *', () => {
      deepEqual(findDependencies(`import * as m from 'm';var foo = {import: 'mm'}`), {
        strings: ['m'],
        expressions: []
      });
    });

    it('export', () => {
      const input = readFileSync(join(__dirname, './fixtures/detective_case/fixture-export.js'), 'utf8');
      deepEqual(findDependencies(input), {
        strings: ['./util', './temporary', './persistent', 'all'],
        expressions: []
      })
    });

  });

  describe('custom case', () => {

    it('should analyze ts file', () => {
      const input = readFileSync(join(__dirname, './fixtures/detective_case/fixture.ts'), 'utf8');
      console.log(findDependencies(input));
    });
  });
});
