import vitePluginFaviconsInject from 'vite-plugin-favicons-inject';

const path = require('path');

export default {
  root: path.resolve(__dirname, 'src'),
  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      '~ol': path.resolve(__dirname, 'node_modules/ol'),
      '~ol-contextmenu': path.resolve(__dirname, 'node_modules/ol-contextmenu'),
    }
  },
  server: {
    port: 8080,
    hot: true
  },
  plugins: [
    process.env.NODE_ENV == "production" ? vitePluginFaviconsInject(path.resolve(__dirname, 'src/images/favicon.svg')) : false,
  ],
  build: {
    minify: false,
  }
}
