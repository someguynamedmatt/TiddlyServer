import * as fs from 'fs'
import * as path from 'path'
import { tryParseJSON, Hashmap } from './server'
import { promisify } from 'util'
import { FileInfo, WikiInfo } from './boot-startup-types'

const loadWikiInfo = async (wikipath: string) => {
  let filePath = path.join(wikipath, 'tiddlywiki.info')
  return promisify(fs.readFile)(filePath, 'utf8').then(data => {
    let wikiInfo: WikiInfo = tryParseJSON(data, error => {
      error.filePath = filePath
      throw error
    })
    return wikiInfo
  })
}

export const loadWikiFolder = (wikipath: string, wikiInfo: WikiInfo) => {
  if (!wikiInfo.type || wikiInfo.type === 'tiddlywiki') {
    return TiddlyWiki.loadWiki(wikipath)
  } else if (wikiInfo.type === 'tiddlyserver') {
    return TiddlyServer.loadWiki(wikipath, wikiInfo, false)
  } else {
    throw new Error('Invalid wikiInfo type ' + wikiInfo.type)
  }
}

/**
 *
 * @param filepath Tiddler file to load
 * @param options hasMetaFile (skips reading meta file if false)
 */
export const loadTiddlersFromFile = async (
  filepath: string,
  options: {
    hasMetaFile?: boolean
  } = {}
) => {
  var ext = path.extname(filepath),
    extensionInfo = global_tw.utils.getFileExtensionInfo(ext),
    type = extensionInfo ? extensionInfo.type : null,
    typeInfo = type ? global_tw.config.contentTypeInfo[type] : null,
    encoding: string = typeInfo ? typeInfo.encoding : 'utf8',
    getMetaFile = ext !== '.json' && options.hasMetaFile !== false

  let [data1, data2] = await Promise.all([
    promisify(fs.readFile)(filepath, encoding).catch((x: NodeJS.ErrnoException) => x),
    getMetaFile ? promisify(fs.readFile)(filepath + '.meta', 'utf8') : Promise.resolve(undefined),
  ])
  let tiddlers = typeof data1 === 'string' ? global_tw.wiki.deserializeTiddlers(ext, data1, {}) : []
  let metadata = data2 ? global_tw.utils.parseFields(data2) : false
  if (metadata && tiddlers.length === 1)
    tiddlers = [global_tw.utils.extend({}, tiddlers[0], metadata)]
  return {
    tiddlers,
    filepath,
    encoding,
    error: typeof data1 === 'string' ? undefined : data1,
    type,
  }
}

export namespace TiddlyWiki {
  export const loadWiki = (wikiPath: string) => {
    const $tw = loadCore()
    $tw.boot.wikiPath = wikiPath
    const wikiInfo = loadWikiTiddlers($tw, wikiPath)
    return { $tw, wikiInfo }
  }

  export const loadCore = () => {
    const $tw = require('../tiddlywiki/boot/boot.js').TiddlyWiki(
      require('../tiddlywiki/boot/bootprefix.js').bootprefix({
        packageInfo: JSON.parse(
          fs.readFileSync(path.join(__dirname, '../tiddlywiki/package.json'), 'utf8')
        ),
      })
    )
    $tw.locationHash = '#'
    if ($tw.browser && !$tw.node) {
      throw 'browser-only not implemented'
    }
    $tw.utils.deepDefaults($tw, {
      modules: {
        titles: Object.create(null),
        types: {}, // hashmap by module type of hashmap of exports
      },
      config: {
        pluginsPath: '../plugins/',
        themesPath: '../themes/',
        languagesPath: '../languages/',
        editionsPath: '../editions/',
        wikiInfo: './tiddlywiki.info',
        wikiPluginsSubDir: './plugins',
        wikiThemesSubDir: './themes',
        wikiLanguagesSubDir: './languages',
        wikiTiddlersSubDir: './tiddlers',
        wikiOutputSubDir: './output',
        jsModuleHeaderRegExpString:
          '^\\/\\*\\\\(?:\\r?\\n)((?:^[^\\r\\n]*(?:\\r?\\n))+?)(^\\\\\\*\\/$(?:\\r?\\n)?)',
        fileExtensionInfo: Object.create(null),
        contentTypeInfo: Object.create(null),
        pluginsEnvVar: 'TIDDLYWIKI_PLUGIN_PATH',
        themesEnvVar: 'TIDDLYWIKI_THEME_PATH',
        languagesEnvVar: 'TIDDLYWIKI_LANGUAGE_PATH',
        editionsEnvVar: 'TIDDLYWIKI_EDITION_PATH',
      },
      log: {},
      unloadTasks: [],
    })
    if (!$tw.boot.tasks.readBrowserTiddlers) {
      // For writable tiddler files, a hashmap of title to {filepath:,type:,hasMetaFile:}
      $tw.boot.files = Object.create(null)
      // System paths and filenames
      $tw.boot.bootPath = path.resolve(__dirname, '../tiddlywiki/boot/')
      $tw.boot.corePath = path.resolve($tw.boot.bootPath, '../core')
      // Read package info
      $tw.packageInfo = $tw.packageInfo || require('../package.json')
    }
    // Add file extension information
    $tw.utils.registerFileType('text/vnd.tiddlywiki', 'utf8', '.tid')
    $tw.utils.registerFileType('application/x-tiddler', 'utf8', '.tid')
    $tw.utils.registerFileType('application/x-tiddlers', 'utf8', '.multids')
    $tw.utils.registerFileType('application/x-tiddler-html-div', 'utf8', '.tiddler')
    $tw.utils.registerFileType('text/vnd.tiddlywiki2-recipe', 'utf8', '.recipe')
    $tw.utils.registerFileType('text/plain', 'utf8', '.txt')
    $tw.utils.registerFileType('text/css', 'utf8', '.css')
    $tw.utils.registerFileType('text/html', 'utf8', ['.html', '.htm'])
    $tw.utils.registerFileType('application/hta', 'utf16le', '.hta', {
      deserializerType: 'text/html',
    })
    $tw.utils.registerFileType('application/javascript', 'utf8', '.js')
    $tw.utils.registerFileType('application/json', 'utf8', '.json')
    $tw.utils.registerFileType('application/pdf', 'base64', '.pdf', {
      flags: ['image'],
    })
    $tw.utils.registerFileType('application/zip', 'base64', '.zip')
    $tw.utils.registerFileType('image/jpeg', 'base64', ['.jpg', '.jpeg'], {
      flags: ['image'],
    })
    $tw.utils.registerFileType('image/png', 'base64', '.png', {
      flags: ['image'],
    })
    $tw.utils.registerFileType('image/gif', 'base64', '.gif', {
      flags: ['image'],
    })
    $tw.utils.registerFileType('image/svg+xml', 'utf8', '.svg', {
      flags: ['image'],
    })
    $tw.utils.registerFileType('image/x-icon', 'base64', '.ico', {
      flags: ['image'],
    })
    $tw.utils.registerFileType('application/font-woff', 'base64', '.woff')
    $tw.utils.registerFileType('audio/ogg', 'base64', '.ogg')
    $tw.utils.registerFileType('video/mp4', 'base64', '.mp4')
    $tw.utils.registerFileType('audio/mp3', 'base64', '.mp3')
    $tw.utils.registerFileType('audio/mp4', 'base64', ['.mp4', '.m4a'])
    $tw.utils.registerFileType('text/markdown', 'utf8', ['.md', '.markdown'], {
      deserializerType: 'text/x-markdown',
    })
    $tw.utils.registerFileType('text/x-markdown', 'utf8', ['.md', '.markdown'])
    $tw.utils.registerFileType('application/enex+xml', 'utf8', '.enex')
    $tw.utils.registerFileType(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'base64',
      '.docx'
    )
    $tw.utils.registerFileType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'base64',
      '.xlsx'
    )
    $tw.utils.registerFileType(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'base64',
      '.pptx'
    )
    $tw.utils.registerFileType('application/x-bibtex', 'utf8', '.bib')
    $tw.utils.registerFileType('application/epub+zip', 'base64', '.epub')
    // Create the wiki store for the app
    $tw.wiki = new $tw.Wiki()
    // Install built in tiddler fields modules
    $tw.Tiddler.fieldModules = $tw.modules.getModulesByTypeAsHashmap('tiddlerfield')
    // Install the tiddler deserializer modules
    $tw.Wiki.tiddlerDeserializerModules = Object.create(null)
    $tw.modules.applyMethods('tiddlerdeserializer', $tw.Wiki.tiddlerDeserializerModules)
    return $tw
  }

  //copied from 5.1.15
  export const loadWikiTiddlers = (
    $tw,
    wikiPath: string,
    options: { parentPaths: any[]; readOnly: boolean } = { parentPaths: [], readOnly: false }
  ) => {
    var parentPaths = options.parentPaths || [],
      wikiInfoPath = path.resolve(wikiPath, $tw.config.wikiInfo),
      wikiInfo,
      pluginFields
    // Bail if we don't have a wiki info file
    if (fs.existsSync(wikiInfoPath)) {
      wikiInfo = JSON.parse(fs.readFileSync(wikiInfoPath, 'utf8'))
    } else {
      return null
    }
    // Load any parent wikis
    if (wikiInfo.includeWikis) {
      parentPaths = parentPaths.slice(0)
      parentPaths.push(wikiPath)
      $tw.utils.each(wikiInfo.includeWikis, info => {
        if (typeof info === 'string') {
          info = { path: info }
        }
        var resolvedIncludedWikiPath = path.resolve(wikiPath, info.path)
        if (parentPaths.indexOf(resolvedIncludedWikiPath) === -1) {
          var subWikiInfo = $tw.loadWikiTiddlers(resolvedIncludedWikiPath, {
            parentPaths: parentPaths,
            readOnly: info['read-only'],
          })
          // Merge the build targets
          wikiInfo.build = $tw.utils.extend([], subWikiInfo.build, wikiInfo.build)
        } else {
          $tw.utils.error('Cannot recursively include wiki ' + resolvedIncludedWikiPath)
        }
      })
    }
    // Load any plugins, themes and languages listed in the wiki info file
    // $tw.loadPlugins(wikiInfo.plugins, $tw.config.pluginsPath, $tw.config.pluginsEnvVar);
    // $tw.loadPlugins(wikiInfo.themes, $tw.config.themesPath, $tw.config.themesEnvVar);
    // $tw.loadPlugins(wikiInfo.languages, $tw.config.languagesPath, $tw.config.languagesEnvVar);
    // Load the wiki files, registering them as writable
    var resolvedWikiPath = path.resolve(wikiPath, $tw.config.wikiTiddlersSubDir)
    $tw.utils.each($tw.loadTiddlersFromPath(resolvedWikiPath), tiddlerFile => {
      if (!options.readOnly && tiddlerFile.filepath) {
        $tw.utils.each(tiddlerFile.tiddlers, tiddler => {
          $tw.boot.files[tiddler.title] = {
            filepath: tiddlerFile.filepath,
            type: tiddlerFile.type,
            hasMetaFile: tiddlerFile.hasMetaFile,
          }
        })
      }
      $tw.wiki.addTiddlers(tiddlerFile.tiddlers)
    })
    // Save the original tiddler file locations if requested
    var config = wikiInfo.config || {}
    if (config['retain-original-tiddler-path']) {
      var output = {}
      for (var title in $tw.boot.files) {
        output[title] = path.relative(resolvedWikiPath, $tw.boot.files[title].filepath)
      }
      $tw.wiki.addTiddler({
        title: '$:/config/OriginalTiddlerPaths',
        type: 'application/json',
        text: JSON.stringify(output),
      })
    }
    // Save the path to the tiddlers folder for the filesystemadaptor
    $tw.boot.wikiTiddlersPath = path.resolve(
      $tw.boot.wikiPath,
      config['default-tiddler-location'] || $tw.config.wikiTiddlersSubDir
    )
    // Load any plugins within the wiki folder
    var wikiPluginsPath = path.resolve(wikiPath, $tw.config.wikiPluginsSubDir)
    if (fs.existsSync(wikiPluginsPath)) {
      var pluginFolders = fs.readdirSync(wikiPluginsPath)
      for (var t = 0; t < pluginFolders.length; t++) {
        pluginFields = $tw.loadPluginFolder(path.resolve(wikiPluginsPath, './' + pluginFolders[t]))
        if (pluginFields) {
          $tw.wiki.addTiddler(pluginFields)
        }
      }
    }
    // Load any themes within the wiki folder
    var wikiThemesPath = path.resolve(wikiPath, $tw.config.wikiThemesSubDir)
    if (fs.existsSync(wikiThemesPath)) {
      var themeFolders = fs.readdirSync(wikiThemesPath)
      for (var t = 0; t < themeFolders.length; t++) {
        pluginFields = $tw.loadPluginFolder(path.resolve(wikiThemesPath, './' + themeFolders[t]))
        if (pluginFields) {
          $tw.wiki.addTiddler(pluginFields)
        }
      }
    }
    // Load any languages within the wiki folder
    var wikiLanguagesPath = path.resolve(wikiPath, $tw.config.wikiLanguagesSubDir)
    if (fs.existsSync(wikiLanguagesPath)) {
      var languageFolders = fs.readdirSync(wikiLanguagesPath)
      for (var t = 0; t < languageFolders.length; t++) {
        pluginFields = $tw.loadPluginFolder(
          path.resolve(wikiLanguagesPath, './' + languageFolders[t])
        )
        if (pluginFields) {
          $tw.wiki.addTiddler(pluginFields)
        }
      }
    }
    return wikiInfo
  }
}

export namespace TiddlyServer {
  export class Wiki {
    public files: any[] = []
    public tiddlers: Hashmap<any> = {}
  }

  export const loadWiki = async (
    wikiPath: string,
    wikiInfo: WikiInfo | undefined,
    fallback: boolean
  ) => {
    if (!wikiInfo) return
    if (wikiInfo.type !== 'tiddlyserver') {
      if (fallback) {
        loadWikiFolder(wikiPath, wikiInfo)
        return undefined as never
      } else throw new Error('Invalid wiki type ' + wikiInfo.type)
    }

    // @ts-ignore WHYYYYYY
    const includes: Promise<{
      $ts: Wiki
      $tw?: any
      wikiInfo: WikiInfo
    }>[] = wikiInfo.includeWikis.map(e => {
      var item = typeof e === 'string' ? { 'path': e, 'read-only': false } : e
      var subWikiPath = path.resolve(wikiPath, item.path)
      return loadWikiInfo(wikiPath).then(wikiInfo => {
        return loadWiki(wikiPath, wikiInfo, true)
      })
    })

    let wiki = (await Promise.all(includes)).reduce((wiki: Wiki, item) => {
      const { $ts, $tw, wikiInfo } = item
      if (!wikiInfo?.type || wikiInfo.type === 'tiddlywiki') {
        if (!$tw) return wiki
        const tiddlers: Hashmap<any>[] = []
        const skipFields: string[] = []
        $tw.wiki.each((tiddler, title) => {
          let fields = {}
          let keys = Object.keys(tiddler.fields).forEach(key => {
            if (skipFields.indexOf(key) === -1) fields[key] = tiddler.fields[key]
          })
          wiki.tiddlers[title] = fields
        })
      } else if (wikiInfo.type === 'tiddlyserver') {
        if (!$ts) return wiki
        Object.keys($ts.tiddlers).forEach((tiddler, title) => {
          wiki.tiddlers[title] = tiddler
        })
      }
      return wiki
    }, new Wiki())
    return loadWikiTiddlers(wikiPath, wikiInfo).then(wikiFiles => {
      wikiFiles.forEach(file => {
        file.tiddlers.forEach(fields => {
          wiki.tiddlers[fields.title] = fields
        })
        delete file.tiddlers
        wiki.files[file.filepath] = file
      })
      return { $ts: wiki, wikiInfo }
    })
  }
}

export const loadWikiTiddlers = async (wikipath: string, wikiInfo: WikiInfo) => {
  let tiddlerFolder = path.join(wikipath, global_tw.config.wikiTiddlersSubDir)
  return promisify(fs.readdir)(tiddlerFolder)
    .catch(x => undefined)
    .then(files => {
      if (!files) return []

      var metas = files.filter(e => path.extname(e) === '.meta')
      var datas = files.filter(e => path.extname(e) !== '.meta')

      return Promise.all<any>(
        datas
          .map(e => {
            return {
              filepath: path.join(tiddlerFolder, e),
              hasMetaFile: metas.indexOf(e + '.meta') > -1,
            }
          })
          .map(item => {
            return loadTiddlersFromFile(item.filepath, {
              hasMetaFile: item.hasMetaFile,
            })
          })
      )
    })
}

export const getFileType = (tiddlerType?: string) => {
  if (!tiddlerType) tiddlerType = 'text/vnd.tiddlywiki'
  var contentTypeInfo = global_tw.config.contentTypeInfo[tiddlerType] || {}
  var extension = contentTypeInfo.extension || '.tid'
  var type = (
    global_tw.config.fileExtensionInfo[extension] || {
      type: 'application/x-tiddler',
    }
  ).type
  return { type, extension }
}

export const getTiddlerFileInfo = (
  fields: Hashmap<any>,
  options: {
    fileInfo?: FileInfo
  } = {}
) => {
  let { type, extension } = getFileType(fields.type)

  var hasMetaFile = type !== 'application/x-tiddler' && type !== 'application/json'
  if (!hasMetaFile) {
    extension = '.tid'
  }
  var filename = fields.title

  filename = filename.replace(/<|>|\:|\"|\||\?|\*|\^|\_|\/|\\/g, str => {
    return '_' + str.charCodeAt(0).toString(16)
  })

  if (filename.substr(-extension.length).toLocaleLowerCase() !== extension.toLocaleLowerCase()) {
    filename = filename + extension
  }

  return { filename, extension, hasMetaFile, type }
}

export let global_tw = TiddlyWiki.loadCore()
