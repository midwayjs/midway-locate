import { existsSync, readFileSync } from 'fs';
import * as globby from 'globby';
import { dirname, isAbsolute, join, extname } from 'path';
import {
  filterModule,
  findDependenciesByAST,
  propertyExists,
  safeGetProperty,
  safeReadJSON,
  findFile,
  findCommonDir,
} from './util';
import { includeDependencies } from './whiltelist';

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
    '**/.faas_debug_tmp/**', // faas 调试临时目录
    'midway.config.ts', // hook 配置
    'vite.config.ts', // vite 配置
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
    const tsConfig = await safeReadJSON(join(this.cwd, 'tsconfig.json'));
    if (tsConfig?.exclude) {
      globOptions.ignore.push(...tsConfig.exclude);
    }
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

    const common = findCommonDir(paths);
    this.tsCodeRoot = join(this.root, common);
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
    this.tsConfigFilePath = await findFile([
      join(this.tsCodeRoot, 'tsconfig.json'),
      join(this.root, 'tsconfig.json'),
      join(this.cwd, 'tsconfig.json'),
    ]);

    if (this.tsConfigFilePath && !this.tsBuildRoot) {
      const tsConfig = await safeReadJSON(this.tsConfigFilePath);
      const distDir = safeGetProperty(tsConfig, 'compilerOptions.outDir');
      if (distDir) {
        this.tsBuildRoot = join(dirname(this.tsConfigFilePath), distDir);
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
        try {
          const file = join(this.tsCodeRoot, p);
          const ext = extname(file);
          const isJSX = ext === '.tsx' || ext === '.jsx' || ext === '.js';

          const result: string[] = findDependenciesByAST(
            readFileSync(file, 'utf-8'),
            isJSX
          );
          result.forEach((module) => {
            filterModule(module, dependencies);
          });
        } catch (err) {
          console.error(
            `"${p}" find dependencies and parse error, err="${err.message}"`
          );
        }
      }
      this.usingDependencies = Array.from(dependencies.values());
      const json = await safeReadJSON(join(this.root, 'package.json'));
      const pkgDeps = json['dependencies'] || [];

      this.usingDependencies = includeDependencies(
        this.usingDependencies,
        pkgDeps
      );
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
    this.usingDependencies.forEach((depName) => {
      if (dependencies[depName]) {
        dependenciesVersion.valid[depName] = dependencies[depName];
      } else {
        dependenciesVersion.unValid.push(depName);
      }
    });
    this.usingDependenciesVersion = dependenciesVersion;
  }

  private async analyzeIntegrationProject() {
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
    let isIntegration = [
      'src/pages',
      'src/index.tsx',
      'src/index.scss',
      'src/index.less',
    ].find((name: string) => {
      return existsSync(join(this.root, name));
    });
    if (!isIntegration && existsSync(join(this.root, 'midway.config.ts'))) {
      const pkgJson: any = safeReadJSON(join(this.root, 'package.json'));
      isIntegration = ['react', 'vue', 'rax'].find(depName => {
        return pkgJson?.dependencies?.[depName] || pkgJson?.devDependencies?.[depName];
      });
    }
    if (isIntegration) {
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
