// code from https://github.com/egoist/konan/blob/master/index.js

import { parse as parser, ParserPlugin } from '@babel/parser';
import traverse from '@babel/traverse';

const plugins = [
  'asyncGenerators',
  'bigInt',
  'classPrivateMethods',
  'classPrivateProperties',
  'classProperties',
  ['decorators', { decoratorsBeforeExport: true }],
  'doExpressions',
  'dynamicImport',
  'estree',
  'exportDefaultFrom',
  'exportNamespaceFrom', // deprecated
  'functionBind',
  'functionSent',
  'importMeta',
  'jsx',
  'logicalAssignment',
  'nullishCoalescingOperator',
  'numericSeparator',
  'objectRestSpread',
  'optionalCatchBinding',
  'optionalChaining',
  'partialApplication',
  'throwExpressions',
  'topLevelAwait',
  'typescript',
] as ParserPlugin[];

export const detective = src => {
  const modules = { strings: [], expressions: [] };
  const options = {
    dynamicImport: true,
  };
  let ast;

  if (typeof src === 'string') {
    const moduleRe = /\b(require|import|export)\b/;

    if (!moduleRe.test(src)) {
      return modules;
    }

    ast = parser(src, { sourceType: 'module', plugins });
  } else {
    ast = src;
  }

  traverse(ast, {
    enter(path) {
      if (path.node.type === 'CallExpression') {
        const callee = path.get('callee');
        const isDynamicImport = options.dynamicImport && callee.isImport();
        if (callee.isIdentifier({ name: 'require' }) || isDynamicImport) {
          const arg = path.node.arguments[ 0 ];
          if (arg.type === 'StringLiteral') {
            modules.strings.push(arg.value);
          } else {
            modules.expressions.push(src.slice(arg.start, arg.end));
          }
        }
      } else if (
        path.node.type === 'ImportDeclaration' ||
        path.node.type === 'ExportNamedDeclaration' ||
        path.node.type === 'ExportAllDeclaration'
      ) {
        const { source } = path.node;
        if (source && source.value) {
          modules.strings.push(source.value);
        }
      }
    },
  });

  return modules;
};
