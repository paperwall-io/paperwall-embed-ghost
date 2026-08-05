import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

const embedVersion = process.env.EMBED_VERSION

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
        entryFileNames: `paperwall-${embedVersion || 'dev'}.js`,
        assetFileNames: `paperwall-${embedVersion || 'dev'}[extname]`,
      },
    },
  },

  // server: {
  //   open: 'html/index.html',
  // },
})
