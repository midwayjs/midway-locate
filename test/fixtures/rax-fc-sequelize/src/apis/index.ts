import { func, provide } from '@midwayjs/faas';
import * as p from './p/a';
import * as sequelize from 'sequelize-typescript';

@provide()
@func('index.handler')
export class IndexHandler {
  handler() {
    return 'hello world';
  }
}
