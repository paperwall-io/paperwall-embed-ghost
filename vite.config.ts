import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

const embedVersion = process.env.EMBED_VERSION

/**
 * Namespaces this repo's build output.
 *
 * embed-ghost is a fork of embed, so both produce the same version tags and
 * both upload into `embed-assets/` on the same bucket. Without this prefix the
 * two builds share a filename and the second publish silently overwrites the
 * first — and since each registers its own SRI hash with the API, the surviving
 * file then fails the other type's integrity check and the browser refuses to
 * run it. The paywall does not error; it just stops existing.
 */
const bundleName = `paperwall-ghost-${embedVersion || 'dev'}`

export default defineConfig({
  plugins: [
    svelte({
      emitCss: false
    }),
  ],
  resolve: {
    alias: {
      '@lib': resolve('./src/lib'),
      '@settings': resolve('./src/settings'),
    }
  },
  build: {
    rollupOptions: {
      // input: {
      //   app: './html/index.html', // default
      // },
      output: {
        // manualChunks: undefined,
        // Bundle into a single file
        entryFileNames: `${bundleName}.js`,
        assetFileNames: `${bundleName}[extname]`,
      },
    },
  },

  // server: {
  //   open: 'html/index.html',
  // },
})
