import { func, provide } from '@midwayjs/faas';

@provide()
@func('index.handler')
export class IndexHandler {
  handler() {
    return 'hello world';
  }
}
