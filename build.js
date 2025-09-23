import fs from 'fs'
import path from 'path'
import * as esbuild from 'esbuild'
import stylePlugin from 'esbuild-style-plugin'
import {solidPlugin} from 'esbuild-plugin-solid'
import dotenv from '@dotenvx/dotenvx'

const env = dotenv.config()

const packageJson = (await import('./package.json', {with: {type: 'json'}})).default

const config = {
  entryPoints: ['src/index.tsx'],
  metafile: true,
  bundle: true,
  loader: {
    '.woff': 'base64',
    '.woff2': 'base64',
  },
  define: {
    'VERSION': JSON.stringify(packageJson.version),
    'ENV': JSON.stringify(process.env.NODE_ENV === 'watch' ? 'development' : 'production'),
    'DIST': JSON.stringify(process.env.DIST ?? 'extension'),
    ...Object.fromEntries(Object.entries(env.parsed).map(([key, value]) => {
      if (process.env.NODE_ENV === 'watch') {
        if (key.startsWith('PRD_')) return null
        else return [key.replace('DEV_', ''), JSON.stringify(value)]
      } else {
        if (key.startsWith('DEV_')) return null
        else return [key.replace('PRD_', ''), JSON.stringify(value)]
      }
    }).filter(v => v !== null))
  },
  outfile: 'tools-for-bttv.js',
  minify: process.env.NODE_ENV !== 'watch',
  treeShaking: process.env.NODE_ENV !== 'watch',
  sourcemap: process.env.NODE_ENV === 'watch' ? 'inline' : false,
  plugins: [{
    name: 'lodash-csp',
    setup(build) {
      build.onLoad({filter: /lodash/}, async (args) => {
        let text = fs.readFileSync(args.path, 'utf8')
        text = text.replace(/Function\('return this'\)\(\)/, 'window')
        return {
          contents: text,
          loader: 'tsx',
        }
      })
    },
  }, {
    name: 'remove-node-require',
    setup(build) {
      build.onLoad({filter: /\.[jt]s$/}, async (args) => {
        let text = fs.readFileSync(args.path, 'utf8')
        text = text.replace(/import [^ ]+ from ['"](node:)?(fs)['"];?/, '')
        text = text.replace(/(const|let|var) [^ ]+ ?= ?require\(['"](node:)?(fs)['"]\);?/, '')
        return {
          contents: text,
          loader: 'ts',
        }
      })
    },
  }, solidPlugin(), stylePlugin({
    cssModulesOptions: {
      generateScopedName: function (name, filename) {
        return 'tfb-' + name + '_' + path.basename(filename).replace(/.module.(sa|s?c)ss/, '');
      },
    }
  })],
}

if (process.env.NODE_ENV === 'watch')
  await (await esbuild.context(config)).watch({})
else {
  const result = await esbuild.build(config)
  fs.writeFileSync('tools-for-bttv.meta.json', JSON.stringify(result.metafile))
}
