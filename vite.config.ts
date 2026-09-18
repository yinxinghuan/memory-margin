import {defineConfig} from 'vite'
import canvasengine from '@canvasengine/compiler'
export default defineConfig({base:'./',plugins:[canvasengine()],resolve:{dedupe:['@signe/reactive','@signe/di','canvasengine','pixi.js','@rpgjs/common']},optimizeDeps:{include:['pixi.js > @xmldom/xmldom']}})
