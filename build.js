import * as esbuild from 'esbuild'

const packageJson = (await import('./package.json', {with: {type: 'json'}})).default

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  define: {
    'VERSION': JSON.stringify(packageJson.version),
  },
  outfile: 'tools-for-bttv.js',
  minify: process.env.NODE_ENV !== 'watch',
  treeShaking: process.env.NODE_ENV !== 'watch',
  sourcemap: process.env.NODE_ENV === 'watch' ? 'inline' : false,
}

if (process.env.NODE_ENV === 'watch')
  await (await esbuild.context(config)).watch({})
else
  await esbuild.build(config)
