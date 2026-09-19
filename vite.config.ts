import {defineConfig} from 'vite'
import canvasengine from '@canvasengine/compiler'
const mediaProxy={
 target:'https://game.aiwaves.tech',
 changeOrigin:true,
 rewrite:(path:string)=>path.replace(/^\/__alteru_media__/,'/alteru-media/api'),
}
export default defineConfig({
 base:'./',
 plugins:[canvasengine()],
 resolve:{dedupe:['@signe/reactive','@signe/di','canvasengine','pixi.js','@rpgjs/common']},
 optimizeDeps:{include:['pixi.js > @xmldom/xmldom']},
 server:{proxy:{'/__alteru_media__':mediaProxy}},
 preview:{proxy:{'/__alteru_media__':mediaProxy}},
})
