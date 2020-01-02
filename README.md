# midway locate

扫描仓库目录结构，找出 midway 的代码位置。

## API

```ts
import { Locator } from '@midwayjs/locate';

const locator = new Locator();
const result = await locator.run();
console.log(result);
```

## Return

- result
  - cwd 当前命令执行路径
  - midwayRoot midway 项目根目录，根据 package.json 查找
  - tsCodeRoot typescript 构建时获取的代码根路径，比如 src/controller/a.ts 和 src/controller/b.ts，tsc 构建时，会在 dist 目录中输出 a.js 和 b.js，这个时候根路径为 src/controller
  - tsConfigFilePath tsconfig.json 的路径，从 tsCodeRoot 到 midwayRoot 之间的最接近的 tsconfig 文件
  - tsBuildRoot 根据 tsconfig.json，获取到的构建输出的目录

