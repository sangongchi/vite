import type { Plugin } from 'vite';

import type {
  ChangeCaseType,
  VitePluginComponentImport,
  LibraryNameChangeCase,
  Lib,
} from './types';

import { createFilter } from '@rollup/pluginutils';
import * as changeCase from 'change-case';
import { init, parse, ImportSpecifier } from 'es-module-lexer'; //语法分析
import MagicString from 'magic-string';
import path from 'path';
import { normalizePath } from 'vite';
import fs from 'fs';

const ensureFileExts: string[] = ['.css', 'js', '.scss', '.less', '.styl'];

const isFn = (value: any): value is (...args: any[]) => any =>
  value != null && Object.prototype.toString.call(value) === '[object Function]';

export default (options: VitePluginComponentImport): Plugin => {
  const {
    include = ['**/*.vue', '**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'],
    exclude = 'node_modules/**',
    root = process.cwd(),  //类似pwd获取当前的工作目录
    libs = [],
  } = options;
  const filter = createFilter(include, exclude);

  let needSourcemap = false;
  let isBuild = false;
  return {
    name: 'vite:style-import', //名字为必填
    enforce: 'post',
    // 在解析 Vite 配置后调用。使用这个钩子读取和存储最终解析的配置。当插件需要根据运行的命令做一些不同的事情时
    configResolved(resolvedConfig) {  //resolvedConfig 存储最终解析的配置
      needSourcemap = !!resolvedConfig.build.sourcemap;
      isBuild = resolvedConfig.isProduction || resolvedConfig.command === 'build';
      writeLog('初始化配置resolvedConfig',resolvedConfig)
    },

    async transform(code, id) {  //钩子函数用于转换已加载的模块内容
      writeLog('transform-Code',code)
      writeLog('transform-id',id)
      if (!code || !filter(id) || !needTransform(code, libs)) {
        return null;
      }

      await init;

      let imports: readonly ImportSpecifier[] = [];
      writeLog('imports', parse(code)[0])
      try {
        imports = parse(code)[0];
     
      } catch (e) {
      }
      if (!imports.length) {
        return null;
      }

      let s: MagicString | undefined;
      const str = () => s || (s = new MagicString(code));

      for (let index = 0; index < imports.length; index++) {
        const { n, se, ss } = imports[index];
        if (!n) continue;

        const lib = getLib(n, libs);
        if (!lib) continue;

        const isResolveComponent = isBuild && !!lib.resolveComponent;

        const importStr = code.slice(ss, se);
        writeLog('importStr',importStr)
        const importVariables = transformImportVar(importStr);
        const importCssStrList = transformComponentCss(root, lib, importVariables);
        writeLog('importVariables',importVariables)
        writeLog('importCssStrList',importCssStrList)
        let compStrList: string[] = [];
        let compNameList: string[] = [];
        writeLog('isResolveComponent',isResolveComponent)
        if (isResolveComponent) {
          const { componentStrList, componentNameList } = transformComponent(lib, importVariables);
          compStrList = componentStrList;
          compNameList = componentNameList;
        }

        // TODO There may be boundary conditions. There is no semicolon ending in the code and the code is connected to one period. But such code should be very bad
        const endIndex = se + 1;

        if (isBuild) {
          str().prependRight(endIndex, `\n${compStrList.join('')}${importCssStrList.join('')}`);
        } else {
          str().append(`\n${compStrList.join('')}${importCssStrList.join('')}`);
        }

        if (isResolveComponent && compNameList.some((item) => importVariables.includes(item))) {
          str().remove(ss, endIndex);
        }

        writeLog('最终的返回结果',str().toString())
      }
      return {
        map: needSourcemap ? str().generateMap({ hires: true }) : null,
        code: str().toString(),
      };
    },
  };
};

// Generate the corresponding component css string array
function transformComponentCss(root: string, lib: Lib, importVariables: readonly string[]) {
  const {
    libraryName,
    resolveStyle,
    esModule,
    libraryNameChangeCase = 'paramCase',
    ensureStyleFile = false,
  } = lib;
  if (!isFn(resolveStyle) || !libraryName) {
    return [];
  }
  const set = new Set<string>();
  for (let index = 0; index < importVariables.length; index++) {
    const name = getChangeCaseFileName(importVariables[index], libraryNameChangeCase);

    let importStr = resolveStyle(name);
    if (esModule) {
      importStr = resolveNodeModules(root, importStr);
    }

    let isAdd = true;

    if (ensureStyleFile) {
      isAdd = ensureFileExists(root, importStr, esModule);
    }

    isAdd && set.add(`import '${importStr}';\n`);
  }
  return Array.from(set);
}

// Generate the corresponding component  string array
function transformComponent(lib: Lib, importVariables: readonly string[]) {
  const {
    libraryName,
    resolveComponent,
    libraryNameChangeCase = 'paramCase', //对文件名称进行转换 name-name
    transformComponentImportName,
  } = lib;
  if (!isFn(resolveComponent) || !libraryName) {
    return {
      componentStrList: [],
      componentNameList: [],
    };
  }

  const componentNameSet = new Set<string>();
  const componentStrSet = new Set<string>();

  for (let index = 0; index < importVariables.length; index++) {
    const libName = importVariables[index];

    const name = getChangeCaseFileName(importVariables[index], libraryNameChangeCase);
    const importStr = resolveComponent(name);

    const importLibName =
      (isFn(transformComponentImportName) && transformComponentImportName(libName)) || libName;

    componentStrSet.add(`import ${importLibName} from '${importStr}';\n`);
    componentNameSet.add(libName);
  }
  return {
    componentStrList: Array.from(componentStrSet),
    componentNameList: Array.from(componentNameSet),
  };
}

// Extract import variables
export function transformImportVar(importStr: string) {
  if (!importStr) {
    return [];
  }

  const exportStr = importStr.replace('import', 'export').replace(/\s+as\s+\w+,?/g, ',');
  let importVariables: readonly string[] = [];
  try {
    importVariables = parse(exportStr)[1];
  } catch (error) {

  }
  return importVariables;
}

// Make sure the file exists
// Prevent errors when importing non-existent css files
function ensureFileExists(root: string, importStr: string, esModule = false) {
  const extName = path.extname(importStr);
  if (!extName) {
    return tryEnsureFile(root, importStr, esModule);
  }

  if (esModule) {
    return fileExists(importStr);
  }

  return true;
}

function tryEnsureFile(root: string, filePath: string, esModule = false) {
  const filePathList = ensureFileExts.map((item) => {
    const p = `${filePath}${item}`;
    return esModule ? p : resolveNodeModules(root, p);
  });
  return filePathList.some((item) => fileExists(item));
}

function fileExists(f: string) {
  try {
    fs.accessSync(f, fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function getLib(libraryName: string, libs: Lib[]) {
  return libs.find((item) => item.libraryName === libraryName);
}

// File name conversion style
export function getChangeCaseFileName(
  importedName: string,
  libraryNameChangeCase: LibraryNameChangeCase
) {
  try {
    return changeCase[libraryNameChangeCase as ChangeCaseType](importedName);
  } catch (error) {
    return importedName;
  }
}

// Do you need to process code
function needTransform(code: string, libs: Lib[]) {
  return !libs.every(({ libraryName }) => {
    return !new RegExp(`('${libraryName}')|("${libraryName}")`).test(code);
  });
}

function resolveNodeModules(root: string, ...dir: string[]) {
  return normalizePath(path.join(root, 'node_modules', ...dir));
}

function writeLog(name,content){
  fs.appendFile('./log.txt',  name+'----===>:'+JSON.stringify(content)+'\n', (err)=>{
  })
}
