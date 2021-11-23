import esbuild from 'esbuild'
import path from 'path'
import del from 'del'
import { execSync } from 'child_process'

try {
  del.sync('./dist')

  for (const format of ['esm' /*, 'cjs'*/]) {
    const outfile = `./dist/js-localize.${format}.js`

    esbuild
      .build({
        entryPoints: ['./src/main/js-localize.ts'],
        bundle: true,
        outfile,
        tsconfig: './tsconfig.json',
        target: 'es2018',
        minify: false,
        sourcemap: true,
        format,
        define: {
          'process.env.NODE_ENV': '"production"'
        }
      })
      .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
      })
  }

  execSync(
    'tsc -p tsconfig.json --emitDeclarationOnly -d --declarationDir dist/types',
    {
      stdio: 'inherit'
    }
  )
} catch (e) {
  console.error('Error:', e)
  throw e
}
