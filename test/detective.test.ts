import { join } from 'path';
import { readFileSync } from 'fs';
import { deepEqual } from 'assert';
import { detective } from '../src/detective';

describe('/test/detective.test.ts', () => {
  describe('konan case', () => {
    const input = readFileSync(join(__dirname, './fixtures/detective_case/fixture.js'), 'utf8');

    it('all', () => {
      deepEqual(detective(input).strings, ['foo', 'vue/dist/vue', 'wow', 'baby', './async-module']);
    });

    it('exclude dynamical import', () => {
      deepEqual(detective(input).strings, ['foo', 'vue/dist/vue', 'wow', 'baby']);
    });

    it('dynamical require', () => {
      deepEqual(
        detective(`
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
        detective(`
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
      deepEqual(detective(`import * as m from 'm';var foo = {import: 'mm'}`), {
        strings: ['m'],
        expressions: []
      });
    });

    it('export', () => {
      const input = readFileSync(join(__dirname, './fixtures/detective_case/fixture-export.js'), 'utf8');
      deepEqual(detective(input), {
        strings: ['./util', './temporary', './persistent', 'all'],
        expressions: []
      })
    });

  });

  describe('custom case', () => {

    it('should analyze ts file', () => {
      const input = readFileSync(join(__dirname, './fixtures/detective_case/fixture.ts'), 'utf8');
      console.log(detective(input).strings);
    });
  });
});
