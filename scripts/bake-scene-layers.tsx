import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {Resvg} from '@resvg/resvg-js'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {SceneArchitecture,architectureInstances} from '../src/architecture'
import {atmospherePlacements} from '../src/atmosphere'
import {entities,world,type Scene} from '../src/world'
import {worldPropCell} from '../src/art'
const selected=new Set(process.argv.slice(2))
const root='doc/rebuild-20260924/layers-raw',jobs:any[]=selected.size?JSON.parse(readFileSync('doc/rebuild-20260924/layer-jobs.json','utf8')):[];mkdirSync(root,{recursive:true})
function bake(id:string,scene:Scene,markup:string,depth:number){
 if(selected.size&&!selected.has(id)&&!(selected.has('--structure')&&/data-wall-piece|data-door-passage/.test(markup)))return
 const old=jobs.findIndex(job=>job.id===id);if(old>=0)jobs.splice(old,1)
 const svg=markup.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024" ').replace(/href="\.\/([^\"]+)"/g,(_,path)=>`href="data:image/png;base64,${readFileSync(`public/${path}`).toString('base64')}"`)
 writeFileSync(`${root}/${id}.png`,new Resvg(svg).render().asPng());jobs.push({id,scene,depth,source:`${root}/${id}.png`,output:`public/art/rpg-layers/${id}.png`})
}
for(const scene of Object.keys(world.scenes) as Scene[]){
 for(const foreground of [false,true]){
  const parts=architectureInstances(scene).filter(p=>foreground?p.kind==='foreground-wall'||p.kind==='south-door'||p.kind==='side-door':p.kind!=='foreground-wall'&&p.kind!=='south-door')
  parts.forEach((p,i)=>{
   const depth=p.kind==='floor'||p.kind==='rug'?-1000:p.kind==='north-wall'||p.kind==='side-wall'?-500:p.kind==='side-door'?(foreground?p.y+p.h:p.y+4):p.y+p.h
   bake(`${scene}-${foreground?'front':'back'}-${i}`,scene,renderToStaticMarkup(<SceneArchitecture scene={scene} foreground={foreground} exportOnly={`part-${i}`}/>),depth)
  })
 }
 for(const p of atmospherePlacements(scene))bake(`${scene}-${p.id}`,scene,renderToStaticMarkup(<SceneArchitecture scene={scene} exportOnly={p.id}/>),p.obstacle?p.obstacle.y+p.obstacle.h:p.rect.y+p.rect.h)
 for(const e of Object.values(entities).filter(e=>e.scene===scene&&e.kind!=='person'&&e.kind!=='door'&&e.id!=='voice-box')){
  const extended:Record<string,string>={'scent-station':'./art/service-maintenance-console.png','neighbor-keepsake':'./art/rebuild-20260924/voice-console.png','repair-scanner':'./art/service-maintenance-console.png','archive-index':'./art/service-memory-archive.png'}
  if(extended[e.id]){
   const v=e.visual,crop=e.id==='archive-index'?'62 67 385 371':e.id==='neighbor-keepsake'?null:'63 68 383 372'
   const content=crop?`<svg x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" viewBox="${crop}" preserveAspectRatio="xMidYMax meet"><image href="${extended[e.id]}" width="512" height="512"/></svg>`:`<image href="${extended[e.id]}" x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" preserveAspectRatio="xMidYMax meet"/>`
   const markup=`<svg viewBox="0 0 384 512">${content}</svg>`
   bake(`${scene}-object-${e.id}`,scene,markup,e.obstacle?e.obstacle.y+e.obstacle.h+.2:v.y+v.h);continue
  }
  const cell=worldPropCell[e.id];if(!cell)continue
  const size=Math.min(e.visual.w,e.visual.h),x=e.visual.x+(e.visual.w-size)/2,y=e.visual.y+(e.visual.h-size)/2
  const markup=`<svg viewBox="0 0 384 512"><svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${cell[0]*320} ${cell[1]*320} 320 320"><image href="./art/objects.png" width="960" height="960"/></svg></svg>`
  bake(`${scene}-object-${e.id}`,scene,markup,e.obstacle?e.obstacle.y+e.obstacle.h+.2:e.visual.y+e.visual.h+.2)
 }
}
writeFileSync('doc/rebuild-20260924/layer-jobs.json',JSON.stringify(jobs,null,2))
