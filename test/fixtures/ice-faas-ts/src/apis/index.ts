import { provide, func, FunctionHandler, inject, FaaSContext } from '@ali/midway-faas';

@provide()
@func('index.handler')
export class IndexHandler implements FunctionHandler {

  @inject()
  ctx: FaaSContext;

  // @inject()
  // serviceManager: ServiceManager;

  /**
   * 发布为 hsf 时
   * 这个参数是 ginkgo 固定的，入参出参都为字符串
   * @param event
   */
  async handler(event: string) {
    return 'hello';
    // return this.serviceManager.tbTppRecommendService.invoke(123, 123);
  }
}
