import { func, provide } from '@midwayjs/faas';
import * as p from './p/a';

@provide()
@func('index.handler')
export class IndexHandler {
  handler() {
    return 'hello world';
  }
}
