import * as globby from 'globby';
import { safeReadJSON, propertyExists, safeGetProperty } from './util';
import { dirname, join, relative } from 'path';
import { find } from './common-path';

export class Locator {
  cwd;
  root;
  tsCodeRoot;
  tsBuildRoot;
  tsConfigFilePath;

  constructor(cwd) {
    this.cwd = cwd || this.analyzeCWD();
  }

  async run() {
    await this.analyzeRoot();
    await this.analyzeTSCodeRoot();
    await this.analyzeTSBuildRoot();
    return {
      cwd: this.cwd,
      midwayRoot: this.root,
      tsCodeRoot: this.tsCodeRoot,
      tsConfigFilePath: this.tsConfigFilePath,
      tsBuildRoot: this.tsBuildRoot,
    };
  }

  private analyzeCWD() {
    return process.cwd();
  }

  /**
   * 分析 midway 系列项目根目录
   */
  private async analyzeRoot() {
    const paths: string[] = await globby(['**/package.json', '!node_modules'], {
      cwd: this.cwd,
    });

    for (let pkgPath of paths) {
      const json = await safeReadJSON(join(this.cwd, pkgPath));
      const result = propertyExists(json, [
        'dependencies.midway',
        'dependencies.@ali/midway',
        'dependencies.@midwayjs/faas',
        'dependencies.@ali/midway-faas',
      ]);
      if (result) {
        this.root = dirname(join(this.cwd, pkgPath));
        return;
      }
    }
  }

  /**
   * 分析 ts 代码的根目录，比如 src，或者其他
   */
  private async analyzeTSCodeRoot() {
    if (!this.root) return;
    const paths: string[] = await globby(
      ['**/*.ts', '!node_modules', '!**/*.d.ts'],
      {
        cwd: this.root,
      }
    );

    const common = find(paths);
    this.tsCodeRoot = join(this.root, common.commonDir);
  }

  /**
   * 分析构建后的根目录
   */
  private async analyzeTSBuildRoot() {
    if (!this.root || !this.tsCodeRoot) return;
    const paths: string[] = await globby(
      ['**/tsconfig.json', '!node_modules'],
      {
        cwd: this.root,
      }
    );
    if (paths && paths.length) {
      const filterArr = [];

      for (const p of paths) {
        if (
          p === 'tsconfig.json' ||
          this.tsCodeRoot.indexOf(dirname(p)) !== -1
        ) {
          let relativeDir = relative(this.tsCodeRoot, join(this.root, p));
          filterArr.push(relativeDir);
        }
      }
      // 排序
      filterArr.sort((path1, path2) => {
        return path1.length - path2.length;
      });
      if (filterArr.length) {
        // 选出最短的路径，代表最接近当前 ts 代码，ts 编译器就会用这个
        this.tsConfigFilePath = join(this.tsCodeRoot, filterArr[0]);
        const tsConfig = await safeReadJSON(this.tsConfigFilePath);
        const distDir = safeGetProperty(tsConfig, 'compilerOptions.outDir');
        if (distDir) {
          this.tsBuildRoot = join(dirname(this.tsConfigFilePath), distDir);
        }
      }
    }
  }
}
