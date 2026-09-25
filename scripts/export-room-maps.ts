import {architectureInstances} from '../src/architecture'
import layers from '../src/scene-layers.json'
import {writeFileSync,readFileSync} from 'node:fs'
import {world,entities,portals,type Scene} from '../src/world'
// Export only runtime maps. Do not overwrite admitted actor/art files.
for(const [id,s] of Object.entries(world.scenes)){
 const b=s.interior,w=world.width,h=world.height
 const obstacles=[{x:0,y:0,w,h:b.y},{x:0,y:b.y+b.h,w,h:h-b.y-b.h},{x:0,y:0,w:b.x,h},{x:b.x+b.w,y:0,w:w-b.x-b.w,h},...s.obstacles]
 const objects=obstacles.map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('')
 writeFileSync(`public/map/${id}.tmx`,`<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="16" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="floor.tsx"/><layer id="1" name="floor" width="12" height="16"><data encoding="csv">${Array(192).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`)
}
console.log(`Exported ${Object.keys(world.scenes).length} room maps`)

const previous=JSON.parse(readFileSync('doc/world-manifest.json','utf8'))
previous.assets=layers.map(l=>({id:l.id,path:'public/'+l.image.slice(2),imageWidth:l.width,imageHeight:l.height,crops:[{x:0,y:0,w:l.width,h:l.height}]}))
previous.scenes=Object.entries(world.scenes).map(([id,s])=>({id,background:layers.find(l=>l.scene===id&&l.depth===-1000)!.id,architecture:architectureInstances(id as Scene),walkRegion:s.interior,spawn:s.spawn,obstacles:s.obstacles,targets:Object.values(entities).filter(e=>e.scene===id).map(e=>({id:e.id,kind:e.kind,approach:e.approach,threshold:e.threshold,activation:e.activation,side:e.side,states:['static'],renderedStates:['static']}))}))
previous.portals=Object.entries(portals).map(([id,p])=>({id,from:p.from,to:p.scene,arrival:p.position,target:p.target}))
writeFileSync('doc/world-manifest.json',JSON.stringify(previous,null,2)+'\n')
