import {readFileSync,writeFileSync} from 'node:fs'
import {architectureInstances} from '../src/architecture'
import {world,type Scene} from '../src/world'
import doorWallArt from '../src/door-wall-art.json'
const sceneIds=Object.keys(world.scenes) as Scene[]
export const projectionWalls=sceneIds.flatMap(scene=>architectureInstances(scene).flatMap((p,index)=>{
 const panel=doorWallArt.find(a=>a.id==='wall-panel-root')!,side=doorWallArt.find(a=>a.id==='door-side-root')!,front=doorWallArt.find(a=>a.id==='door-front-root-v2')!
 const base={id:`${scene}-${p.kind}-${index}`}
 if(p.kind==='north-wall'||p.kind==='foreground-wall')return[{...base,path:panel.output,sourceCrop:[0,0,panel.width,panel.height],displayWorld:[panel.width*p.h/panel.height,p.h],assembly:'whole tile repeated then clipped to segment; displayWorld is one tile'}]
 if(p.kind==='side-wall')return[{...base,path:panel.output,sourceCrop:[0,0,panel.width,95],displayWorld:[panel.width*p.w/95,p.w],assembly:'top cap repeated then rotated 90 degrees; dimensions before rotation',scaleGroup:`${scene}-side-cap`}]
 if(p.kind==='north-door'||p.kind==='south-door')return[{...base,path:front.output,sourceCrop:[0,0,front.width,front.height],displayWorld:[(p.h-5)*front.width/front.height,p.h-5],assembly:'leaf centered inside separate jambs'}]
 if(p.kind==='side-door')return[{...base,path:side.output,sourceCrop:[0,0,side.width,side.height],displayWorld:[70*side.width/side.height,70],assembly:'east-facing leaf only; west leaf opens outside this room'}]
 return []
}))

if(process.argv.includes('--write')){
 const path='assets/projection-audit.json',audit=JSON.parse(readFileSync(path,'utf8'))
 audit.walls=projectionWalls;writeFileSync(path,JSON.stringify(audit,null,2)+'\n')
 writeFileSync('doc/rebuild-20260924/architecture-projection.json',JSON.stringify({version:1,walls:projectionWalls},null,2)+'\n')
}
