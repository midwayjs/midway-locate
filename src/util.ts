import * as fse from 'fs-extra';

export const exists = async (file: string) => {
  return fse.pathExists(file);
};

export const safeReadJSON = async (file: string) => {
  if (await exists(file)) {
    try {
      return fse.readJSON(file);
    } catch (_) {
      return {};
    }
  } else {
    return {};
  }
};

export const safeGetProperty = (json: object, property: string | string[]) => {
  if (!json) {
    return null;
  }

  let properties = property;
  if (typeof property === 'string') {
    properties = property.split('.');
  }

  const currentProperty = (properties as string[]).shift();

  if (properties.length > 0 && typeof json[currentProperty] === 'object') {
    return safeGetProperty(json[currentProperty], properties);
  }

  return json[currentProperty];
};

export const propertyExists = (json: object, properties: string[]): boolean => {
  for (let propertyText of properties) {
    const data = safeGetProperty(json, propertyText);
    if (data) {
      return true;
    }
  }
  return false;
};

const nativeModule = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',
  'config',
];

export const filterModule = (module: string, modules: Set<string>) => {
  // remove local module
  if (/^\./.test(module)) return;

  // filter native module
  if (nativeModule.indexOf(module) !== -1) return;

  if (/^@/.test(module)) {
    // @midwayjs/abc/bbb
    if (module.match(/\//g)?.length >= 2) {
      const result = module.split('/');
      module = result[0] + '/' + result[1];
    }
  } else {
    // abc/bbb
    if (module.match(/\//g)?.length >= 1) {
      const result = module.split('/');
      module = result[0];
    }
  }

  modules.add(module);
};

export const findDependencies = src => {
  const dep = [];
  src.replace(/(import .+ )?(from|require)\s?['"(](.+)['")]/g, (...args) => {
    dep.push(args[3]);
    return args[3];
  });
  return dep;
};
