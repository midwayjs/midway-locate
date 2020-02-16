# midway locate

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/midwayjs/midway-locate/blob/master/LICENSE)
[![GitHub tag](https://img.shields.io/github/tag/midwayjs/midway-locate.svg)]()
[![Build Status](https://travis-ci.com/midwayjs/midway-locate.svg?branch=develop)](https://travis-ci.com/midwayjs/midway-locate)
[![Test Coverage](https://img.shields.io/codecov/c/github/midwayjs/midway-locate/master.svg)](https://codecov.io/gh/midwayjs/midway-locate/branch/master)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/midwayjs/midway-locate/pulls)


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
  - `cwd` 当前命令执行路径，一般是项目根目录
  - `midwayRoot` midway 项目根目录，根据 package.json 查找
  - `tsCodeRoot` typescript 构建时获取的代码根路径，比如 src/controller/a.ts 和 src/controller/b.ts，tsc 构建时，会在 dist 目录中输出 a.js 和 b.js，这个时候根路径为 src/controller
  - `tsConfigFilePath` tsconfig.json 的路径，从 tsCodeRoot 到 midwayRoot 之间的最接近的 tsconfig 文件
  - `tsBuildRoot` 根据 tsconfig.json，获取到的构建输出的目录
  - `integrationProject`: 是否是一体化项目
  - `integrationProjectType`: 项目类型
  - `usingDependencies`: 使用的依赖，一体化项目会根据 tsCodeRoot 分析使用的依赖（package.json 的子集），其他项目直接读取 package.json 中的依赖
  - `usingDependenciesVersion`: 带版本，同上

## 其他

可以在 package.json 中传入 `tsCodeRoot` 和 `tsBuildRoot`，但是以 `run` 的参数为主。

```json
{
  "midway-integration": {
    "tsCodeRoot": "src/apis",
    "tsBuildRoot": "build/faas"
  }
}
```

## 支持目录

- [x] 纯 midway 项目
- [x] midway + 前端（分目录）
- [x] midway + 前端（合目录）
- [x] 纯 midway-faas
- [x] midway-faas + 前端（分目录）
- [x] midway-faas + 前端（合目录）

## License

[MIT](http://github.com/midwayjs/midway-locate/blob/master/LICENSE)
