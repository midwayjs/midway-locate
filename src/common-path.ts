// code from https://github.com/mdjermanovic/common-path

const NodePath = require('path');

/**
 * Custom common path function.
 *
 * @param {Object} Path Provides platform-specific parse() and sep.
 * @param {(string[]|any[])} paths Array of path strings or objects containing path strings.
 * @param {string} [pathKey] Key of a property whose value is path string.
 * @returns {CommonPath} Common parent directory and parsed paths.
 */
function customFind(Path, paths, pathKey) {
  if (!Path || !Path.parse || !Path.sep) {
    throw new TypeError('Path must implement parse() and sep');
  }
  if (!Array.isArray(paths)) {
    throw new TypeError('paths must be an array');
  }
  if (pathKey !== undefined && typeof pathKey !== 'string') {
    throw new TypeError('pathKey must be a string or undefined');
  }

  if (!paths.length) {
    return { commonRoot: null, commonDir: null, parsedPaths: [] };
  }

  const workingPaths = [].map.call(paths, original => {
    // Find path string in the given element
    let pathString = undefined;
    if (typeof original === 'string') {
      pathString = original;
    } else if (original !== null && typeof original === 'object') {
      if (pathKey === undefined) {
        throw new TypeError(
          'If pathKey is not defined, paths array cannot contain objects'
        );
      }
      if (typeof original[pathKey] !== 'string') {
        throw new TypeError('object[pathKey] must be a string');
      }
      pathString = original[pathKey];
    } else {
      throw new TypeError('paths array elements must be strings or objects');
    }
    const { root, dir, base, name, ext } = Path.parse(pathString);
    return { original, root, dir, base, name, ext, pathString };
  });

  const sep = Path.sep;
  const iterator = workingPaths[Symbol.iterator]();
  // First element. Zero-length arrays are already solved.
  let {
    value: { root: commonRoot, dir: commonDir },
  } = iterator.next();
  if (workingPaths.some(({ root }) => root !== commonRoot)) {
    // Different kinds of paths (e.g. absolute vs relative or unc), or same with e.g. different drive letters.
    // Also correctly handles unc paths - server name is not a common path for its two shared folders.
    commonRoot = null;
    commonDir = null;
  } else if (commonDir.length > commonRoot.length) {
    let { done, value } = iterator.next();
    while (!done) {
      if (value.dir.startsWith(commonDir)) {
        ({ done, value } = iterator.next());
      } else {
        const lastSepIndex = commonDir.lastIndexOf(sep);
        if (lastSepIndex <= commonRoot.length) {
          // Either nothing to cut (lastIndexOf is -1) or it would become root, or even below the root.
          // Also correctly handles cases when relative drive path (e.g. C:) should be the common dir
          commonDir = commonRoot;
          done = true;
        } else {
          // Cut and try again with the same element in the next iteration
          commonDir = commonDir.slice(0, lastSepIndex);
        }
      }
    }
  }
  // Name-prefixed UNC paths should have same server and shared folder
  const nmsUNCRoot = `${sep}${sep}?${sep}UNC${sep}`;
  if (
    commonRoot === nmsUNCRoot &&
    commonDir.lastIndexOf(sep) < nmsUNCRoot.length
  ) {
    commonRoot = null;
    commonDir = null;
  }

  const endsWithSep = commonDir !== null && commonDir.endsWith(sep);
  return {
    commonRoot,
    commonDir,
    parsedPaths: workingPaths.map(
      ({ original, dir, base, name, ext, pathString }) => {
        const commonPartLength =
          commonDir === null
            ? 0
            : !endsWithSep && pathString[commonDir.length] === sep
            ? commonDir.length + 1
            : commonDir.length;
        return {
          original,
          subdir: commonDir === null ? null : dir.slice(commonPartLength),
          commonPart: pathString.slice(0, commonPartLength),
          subPart: pathString.slice(
            commonPartLength,
            pathString.length - base.length
          ),
          basePart: base,
          namePart: name,
          extPart: ext,
        };
      }
    ),
  };
}

/**
 * Cross-platform common path function.
 *
 * @param {(string[]|any[])} paths Array of path strings or objects containing path strings.
 * @param {string} [pathKey] Key of a property whose value is path string.
 * @returns {CommonPath} Common parent directory and parsed paths.
 */
export function find(paths, pathKey?) {
  return customFind(NodePath, paths, pathKey);
}
