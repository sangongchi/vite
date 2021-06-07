import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import viteAutoRoute = require('./plugins/router-plugin.js')
import json from '@rollup/plugin-json';
import ele from './plugins/vite-plugin-element_plus'
import image from './plugins/vite-plugin-img'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), json(),image(), ele({
    libs:[
      {
        libraryName: 'element-plus',
        resolveStyle: (name) => {
          return `element-plus/lib/theme-chalk/${name}.css`;
        },
        resolveComponent: (name) => {
          return `element-plus/lib/${name}`;
        },
      },
    ]
  })]
})
