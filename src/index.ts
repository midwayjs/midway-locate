import { existsSync, readFileSync } from 'fs';
import * as globby from 'globby';
import { dirname, isAbsolute, join, relative } from 'path';
import { find } from './common-path';
import {
  filterModule,
  findDependenciesByAST,
  propertyExists,
  safeGetProperty,
  safeReadJSON,
} from './util';

export enum ProjectType {
  UNKNOWN = 'unknown',
  MIDWAY = 'midway',
  MIDWAY_FRONT_MONOREPO = 'midway_front_monorepo',
  MIDWAY_FRONT_integration = 'midway_front_integration',
  MIDWAY_FAAS = 'midway_faas',
  MIDWAY_FAAS_FRONT_MONOREPO = 'midway_faas_front_monorepo',
  MIDWAY_FAAS_FRONT_integration = 'midway_faas_front_integration',
}

const globOptions = {
  followSymbolicLinks: false,
  ignore: [
    '**/node_modules/**', // 模块依赖目录
    '**/test/**', // 测试目录
    '**/run/**', // egg 运行调试目录
    '**/public/**', // 公共assets目录
    '**/build/**', // 构建产物目录
    '**/dist/**', // 构建产物目录
    '**/.serverless/**', // faas 构建目录
    '**/faas_debug_tmp/**', // faas 调试临时目录
  ],
};

export interface AnalyzeResult {
  cwd: string;
  midwayRoot: string;
  tsCodeRoot: string;
  tsConfigFilePath: string;
  tsBuildRoot: string;
  integrationProject: boolean;
  projectType: ProjectType;
  usingDependencies: string[];
  usingDependenciesVersion: {
    valid: object;
    unValid: string[];
  };
}

export class Locator {
  cwd: string;
  root: string;
  tsCodeRoot: string;
  tsBuildRoot: string;
  tsConfigFilePath: string;
  usingDependencies: string[];
  usingDependenciesVersion: { valid: object; unValid: string[] };
  integrationProject = false;
  projectType: ProjectType = ProjectType.UNKNOWN;
  isMidwayProject = false;
  isMidwayFaaSProject = false;

  constructor(cwd) {
    this.cwd = cwd || this.analyzeCWD();
  }

  async run(
    options: {
      root?: string;
      tsCodeRoot?: string;
      tsBuildRoot?: string;
    } = {}
  ): Promise<AnalyzeResult> {
    await this.formatOptions(options);
    this.tsCodeRoot = options.tsCodeRoot;
    this.tsBuildRoot = options.tsBuildRoot;

    await this.analyzeRoot();
    await this.analyzeTSCodeRoot();
    await this.analyzeTSBuildRoot();
    await this.analyzeIntegrationProject();
    await this.analyzeUsingDependencies();
    await this.analyzeUsingDependenciesVersion();
    return {
      cwd: this.cwd,
      midwayRoot: this.root,
      tsCodeRoot: this.tsCodeRoot,
      tsConfigFilePath: this.tsConfigFilePath,
      tsBuildRoot: this.tsBuildRoot,
      integrationProject: this.integrationProject,
      projectType: this.projectType,
      usingDependencies: this.usingDependencies,
      usingDependenciesVersion: this.usingDependenciesVersion,
    };
  }

  private analyzeCWD() {
    return process.cwd();
  }

  private async formatOptions(options) {
    const json = await safeReadJSON(join(this.cwd, 'package.json'));
    const integrationOptions: {
      tsCodeRoot: string;
      tsBuildRoot: string;
      projectType: string;
    } = safeGetProperty(json, 'midway-integration') || {};
    if (!options.tsCodeRoot) {
      options.tsCodeRoot = integrationOptions.tsCodeRoot;
    }
    if (!options.tsBuildRoot) {
      options.tsBuildRoot = integrationOptions.tsBuildRoot;
    }
  }

  /**
   * 分析 midway 系列项目根目录
   */
  private async analyzeRoot() {
    const paths: string[] = await globby(['**/package.json'], {
      ...globOptions,
      cwd: this.cwd,
      deep: 2,
    });

    // find midway root
    for (let pkgPath of paths) {
      const json = await safeReadJSON(join(this.cwd, pkgPath));
      let result = propertyExists(json, [
        'dependencies.midway',
        'dependencies.@ali/midway',
      ]);
      if (result) {
        this.isMidwayProject = true;
        this.root = dirname(join(this.cwd, pkgPath));
        break;
      }
      result = propertyExists(json, [
        'dependencies.@midwayjs/faas',
        'dependencies.@ali/midway-faas',
      ]);
      if (result) {
        this.isMidwayFaaSProject = true;
        this.root = dirname(join(this.cwd, pkgPath));
        break;
      }
    }
  }

  /**
   * 分析 ts 代码的根目录，比如 src，或者其他
   */
  private async analyzeTSCodeRoot() {
    if (!this.root) {
      return;
    }
    if (this.tsCodeRoot) {
      this.tsCodeRoot = this.formatAbsolutePath(this.tsCodeRoot);
      return;
    }

    const paths: string[] = await globby(['**/*.ts', '!**/*.d.ts'], {
      ...globOptions,
      cwd: this.root,
    });

    const common = find(paths);
    this.tsCodeRoot = join(this.root, common.commonDir);
  }

  /**
   * 分析构建后的根目录
   */
  private async analyzeTSBuildRoot() {
    if (!this.root || !this.tsCodeRoot) {
      return;
    }

    if (this.tsBuildRoot) {
      this.tsBuildRoot = this.formatAbsolutePath(this.tsBuildRoot);
    }
    const paths: string[] = await globby(['**/tsconfig.json'], {
      ...globOptions,
      cwd: this.root,
      deep: 5,
    });
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
        if (!this.tsBuildRoot) {
          const tsConfig = await safeReadJSON(this.tsConfigFilePath);
          const distDir = safeGetProperty(tsConfig, 'compilerOptions.outDir');
          if (distDir) {
            this.tsBuildRoot = join(dirname(this.tsConfigFilePath), distDir);
          }
        }
      }
    }
  }

  /**
   * 分析用到的依赖
   */
  private async analyzeUsingDependencies() {
    if (!this.root || !this.tsCodeRoot) return;

    if (this.integrationProject) {
      // 一体化项目，需要分析函数用到的依赖
      const dependencies: Set<string> = new Set();
      const paths: string[] = await globby(
        ['**/*.ts', '**/*.js', '!**/*.d.ts'],
        {
          ...globOptions,
          cwd: this.tsCodeRoot,
        }
      );

      for (const p of paths) {
        const result: string[] = findDependenciesByAST(
          readFileSync(join(this.tsCodeRoot, p), 'utf-8')
        );

        result.forEach(module => {
          filterModule(module, dependencies);
        });
      }
      this.usingDependencies = Array.from(dependencies.values());
    } else {
      const json = await safeReadJSON(join(this.root, 'package.json'));
      const dependencies = json['dependencies'] || [];
      this.usingDependencies = Object.keys(dependencies);
    }
  }

  private async analyzeUsingDependenciesVersion() {
    if (!this.root || !this.tsCodeRoot || !this.usingDependencies) return;
    const json = await safeReadJSON(join(this.root, 'package.json'));
    const dependencies = json['dependencies'] || [];
    const dependenciesVersion = {
      valid: {},
      unValid: [],
    };
    this.usingDependencies.forEach(depName => {
      if (dependencies[depName]) {
        dependenciesVersion.valid[depName] = dependencies[depName];
      } else {
        dependenciesVersion.unValid.push(depName);
      }
    });
    this.usingDependenciesVersion = dependenciesVersion;
  }

  private analyzeIntegrationProject() {
    if (!this.root) return;

    // 当前目录不等于 midway 根目录，对等视图
    if (this.cwd !== this.root) {
      if (this.isMidwayProject) {
        this.projectType = ProjectType.MIDWAY_FRONT_MONOREPO;
      } else {
        this.projectType = ProjectType.MIDWAY_FAAS_FRONT_MONOREPO;
      }
      return;
    }

    // 全 ts 版本，前后端代码可能在一起，前端视图的情况
    // rax/ice 等
    if (existsSync(join(this.root, 'src/pages'))) {
      this.integrationProject = true;
      if (this.isMidwayProject) {
        this.projectType = ProjectType.MIDWAY_FRONT_integration;
      } else {
        this.projectType = ProjectType.MIDWAY_FAAS_FRONT_integration;
      }
      return;
    }

    // 剩下可能就是纯应用
    if (this.isMidwayProject) {
      this.projectType = ProjectType.MIDWAY;
    } else if (this.isMidwayFaaSProject) {
      this.projectType = ProjectType.MIDWAY_FAAS;
    }
  }

  private formatAbsolutePath(p: string) {
    if (!isAbsolute(p)) {
      return join(this.root, p);
    }
    return p;
  }
}
