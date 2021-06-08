import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
const path = require('path');

import { viteMockServe } from 'vite-plugin-mock';
// import viteAutoRoute = require('./plugins/router-plugin.js')
import json from '@rollup/plugin-json';
import ele from './plugins/vite-plugin-element_plus';
import image from './plugins/vite-plugin-img';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  plugins: [
    vue(),
    json(),
    viteMockServe({
      mockPath: 'mock',
      supportTs: true,
    }),
    image(),
    ele({
      libs: [
        {
          libraryName: 'element-plus',
          resolveStyle: (name) => {
            return `element-plus/lib/theme-chalk/${name}.css`;
          },
          resolveComponent: (name) => {
            return `element-plus/lib/${name}`;
          },
        },
      ],
    }),
  ],
});
