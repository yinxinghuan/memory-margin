import {projectionWalls} from './rebuild-architecture-projection'
import {copyFileSync,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {Resvg} from '@resvg/resvg-js'
import {world,entities,portals,type Scene} from '../src/world'
import {architectureInstances,sideWallSource,wall} from '../src/architecture'
import {actorCellWorld,worldPropCell} from '../src/art'
import {largeDetails,largeReviewWorld,largePlacements} from '../src/large-scene-world'
import {auditPlacements,auditRoomWorld} from '../src/generated-room-world'

mkdirSync('public/map',{recursive:true});mkdirSync('public/art',{recursive:true});mkdirSync('doc',{recursive:true})
const png=(svg:string)=>new Resvg(svg,{fitTo:{mode:'original'}}).render().asPng()
const modules=[['home-ground-v4',768,1024],['hall-ground-v3',768,1024],['service-ground-v3',768,1024],['home-wall-v5',768,256],['hall-wall-v4',768,256],['service-wall-v4',768,256],['wall-north',768,256],['home-side-wall-v7',256,1536],['hall-side-wall-v7',256,1536],['service-side-wall-v7',256,1536]] as const
mkdirSync('public/art/modules',{recursive:true})
for(const [id] of modules)copyFileSync(`assets/platform/modules/${id}.png`,`public/art/modules/${id}.png`)
copyFileSync('assets/platform/modules/large-concourse-ground-v1.png','public/art/modules/large-concourse-ground-v1.png')
copyFileSync('assets/processed/rug.png','public/art/modules/rug.png')
for(const id of ['home-worktable-v5','service-console-v6'] as const)copyFileSync(`assets/processed/${id}.png`,`public/art/modules/${id}.png`)
copyFileSync('assets/processed/door-leaf-v2.png','public/art/modules/door-leaf-v2.png')
for(const id of ['door-front-atlas-v3','door-side-passage-v3','door-side-leaf-v5'] as const)copyFileSync(`assets/processed/${id}.png`,`public/art/modules/${id}.png`)
copyFileSync('assets/platform/portraits/cast.png','public/art/cast.png')
for(const id of ['neighbor-stand-v5','caretaker-stand-v5','clerk-stand-v5'] as const)copyFileSync(`assets/processed/${id}-aligned.png`,`public/art/${id}.png`)
copyFileSync('assets/processed/world-props-v2.png','public/art/objects.png')
copyFileSync('assets/processed/ambient-home-props-v1.png','public/art/ambient-home-props.png')
if(existsSync('assets/processed/large-concourse-detail-atlas-v1.png'))copyFileSync('assets/processed/large-concourse-detail-atlas-v1.png','public/art/large-concourse-detail-atlas-v1.png')
mkdirSync('public/art/generated-room',{recursive:true})
copyFileSync('assets/benchmark/generated-room/audit-room-floor.png','public/art/generated-room/audit-room-floor.png')
copyFileSync('assets/benchmark/generated-room/processed/audit-resonance-scanner.png','public/art/generated-room/audit-resonance-scanner.png')
copyFileSync('assets/benchmark/generated-room/processed/audit-comparison-console-v2.png','public/art/generated-room/audit-comparison-console.png')
copyFileSync('assets/benchmark/generated-room/processed/audit-sealed-buffer.png','public/art/generated-room/audit-sealed-buffer.png')
copyFileSync('assets/processed/ambient-home-furniture-v2.png','public/art/ambient-home-furniture.png')
copyFileSync('assets/processed/service-memory-chair-v2.png','public/art/service-memory-chair.png')
copyFileSync('assets/processed/service-memory-archive-v5.png','public/art/service-memory-archive.png')
copyFileSync('assets/processed/service-maintenance-console-v4.png','public/art/service-maintenance-console.png')
copyFileSync('assets/platform/modules/home-ground-furnished-v3.png','public/art/modules/home-ground-furnished-v3.png')

copyFileSync('assets/processed/hero-walk-v7.png','public/art/hero.png')
writeFileSync('public/map/transparent.png',png('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"/>'))
writeFileSync('public/map/floor.tsx','<?xml version="1.0"?><tileset name="floor" tilewidth="32" tileheight="32" tilecount="1" columns="1"><image source="transparent.png" width="32" height="32"/></tileset>')
const scenes=Object.entries(world.scenes).map(([id,s])=>{
 const b=s.interior,obstacles=[{x:0,y:0,w:384,h:b.y},{x:0,y:b.y+b.h,w:384,h:512-b.y-b.h},{x:0,y:0,w:b.x,h:512},{x:b.x+b.w,y:0,w:384-b.x-b.w,h:512},...s.obstacles]
 const objects=obstacles.map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('')
 writeFileSync(`public/map/${id}.tmx`,`<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="16" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="floor.tsx"/><layer id="1" name="floor" width="12" height="16"><data encoding="csv">${Array(192).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`)
 return {id,background:id==='home'?'home-floor-rebuild-20260924':id==='hall'?'hall-ground-v3':'service-ground-v3',architecture:architectureInstances(id as Scene),walkRegion:s.interior,spawn:s.spawn,obstacles:s.obstacles,targets:Object.values(entities).filter(e=>e.scene===id).map(e=>({id:e.id,kind:e.kind,approach:e.approach,threshold:e.threshold,activation:e.activation,side:e.side,states:['static'],renderedStates:['static']}))}
})
{
 const s=largeReviewWorld.scenes['large-review'],b=s.interior,w=largeReviewWorld.width,h=largeReviewWorld.height
 const obstacles=[{x:0,y:0,w,h:b.y},{x:0,y:b.y+b.h,w,h:h-b.y-b.h},{x:0,y:0,w:b.x,h},{x:b.x+b.w,y:0,w:w-b.x-b.w,h},...largePlacements.map(p=>p.obstacle),...largeDetails.flatMap(detail=>detail.obstacle?[detail.obstacle]:[])]
 const objects=obstacles.map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('')
 writeFileSync('public/map/large-review.tmx',`<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="24" height="24" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="floor.tsx"/><layer id="1" name="floor" width="24" height="24"><data encoding="csv">${Array(576).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`)
}
{
 const s=auditRoomWorld.scenes['generated-audit-room'],b=s.interior,w=auditRoomWorld.width,h=auditRoomWorld.height
 const obstacles=[{x:0,y:0,w,h:b.y},{x:0,y:b.y+b.h,w,h:h-b.y-b.h},{x:0,y:0,w:b.x,h},{x:b.x+b.w,y:0,w:w-b.x-b.w,h},...auditPlacements.map(item=>item.obstacle)]
 const objects=obstacles.map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('')
 writeFileSync('public/map/generated-audit-room.tmx',`<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="16" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="floor.tsx"/><layer id="1" name="floor" width="12" height="16"><data encoding="csv">${Array(192).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`)
}
const assets=[...modules.map(([id,w,h])=>({id,path:`public/art/modules/${id}.png`,imageWidth:w,imageHeight:h,crops:[{x:0,y:0,w,h}]})),{id:'rug',path:'public/art/modules/rug.png',imageWidth:512,imageHeight:256,crops:[{x:0,y:0,w:512,h:256}]},...(['home-worktable-v5','service-console-v6'] as const).map(id=>({id,path:`public/art/modules/${id}.png`,imageWidth:512,imageHeight:512,crops:[{x:0,y:0,w:512,h:512}]})),{id:'door-front-atlas-v3',path:'public/art/modules/door-front-atlas-v3.png',imageWidth:768,imageHeight:512,crops:[{x:0,y:0,w:384,h:512},{x:384,y:0,w:384,h:512}]},{id:'door-side-passage-v3',path:'public/art/modules/door-side-passage-v3.png',imageWidth:768,imageHeight:512,crops:[{x:0,y:0,w:768,h:512}]},{id:'door-side-leaf-v5',path:'public/art/modules/door-side-leaf-v5.png',imageWidth:512,imageHeight:768,crops:[{x:78,y:66,w:350,h:634}]},{id:'cast',path:'public/art/cast.png',imageWidth:1024,imageHeight:1024,crops:[{x:0,y:0,w:512,h:512},{x:512,y:0,w:512,h:512},{x:0,y:512,w:512,h:512},{x:512,y:512,w:512,h:512}]},...(['neighbor-stand-v5','caretaker-stand-v5','clerk-stand-v5'] as const).map(id=>({id,path:`public/art/${id}.png`,imageWidth:256,imageHeight:256,crops:[{x:0,y:0,w:256,h:256}]})),{id:'objects',path:'public/art/objects.png',imageWidth:960,imageHeight:960,crops:Array.from({length:9},(_,i)=>({x:i%3*320,y:Math.floor(i/3)*320,w:320,h:320}))},{id:'hero',path:'public/art/hero.png',imageWidth:768,imageHeight:1024,crops:Array.from({length:12},(_,i)=>({x:i%3*256,y:Math.floor(i/3)*256,w:256,h:256}))}]
assets.push({id:'door-leaf-v2',path:'public/art/modules/door-leaf-v2.png',imageWidth:512,imageHeight:512,crops:[{x:0,y:0,w:512,h:512}]})
const rebuildAssets=JSON.parse(readFileSync('doc/rebuild-20260924/art/processing.json','utf8')) as Array<{id:string;output:string;processed:[number,number]}>
for(const asset of rebuildAssets.filter(a=>a.id!=='hero-root'))assets.push({id:`${asset.id}-rebuild-20260924`,path:asset.output,imageWidth:asset.processed[0],imageHeight:asset.processed[1],crops:[{x:0,y:0,w:asset.processed[0],h:asset.processed[1]}]})
const manifest={version:1,coordinateAnchor:'top-left' as const,world:{width:384,height:512,step:world.step},actor:{width:world.actor.w,height:world.actor.h},assets,scenes,portals:Object.entries(portals).map(([id,p])=>({id,from:p.from,to:p.scene,arrival:p.position,target:p.target}))}
writeFileSync('doc/world-manifest.json',JSON.stringify(manifest,null,2)+'\n')
const sceneIds=Object.keys(world.scenes) as Scene[]
const sliceCrop=(sourceWidth:number,sourceHeight:number,displayWidth:number,displayHeight:number)=>{
 const scale=Math.max(displayWidth/sourceWidth,displayHeight/sourceHeight)
 const w=displayWidth/scale,h=displayHeight/scale
 return [(sourceWidth-w)/2,(sourceHeight-h)/2,w,h]
}
const projectionProps=[
 ...sceneIds.flatMap(scene=>architectureInstances(scene).filter(p=>p.kind==='desk-wood'||p.kind==='desk-service').map((p,index)=>({id:`${scene}-table-${index}`,path:`public/art/modules/${p.kind==='desk-service'?'service-console-v6':'home-worktable-v5'}.png`,sourceCrop:[72,72,368,372],displayWorld:[p.w,p.h],visibleWidthToAdultRange:[.95,1.2]}))),
 ...Object.values(entities).filter(e=>worldPropCell[e.id]).map(e=>({id:`${e.scene}-${e.id}`,path:'public/art/objects.png',sourceCrop:[worldPropCell[e.id]![0]*320,worldPropCell[e.id]![1]*320,320,320],displayWorld:[Math.min(e.visual.w,e.visual.h),Math.min(e.visual.w,e.visual.h)]})),
]
const newConsole=rebuildAssets.find(a=>a.id==='voice-console')!
const oldConsoleIndex=projectionProps.findIndex(p=>p.id==='home-table-0')
if(oldConsoleIndex>=0)projectionProps[oldConsoleIndex]={...projectionProps[oldConsoleIndex],path:newConsole.output,sourceCrop:[0,0,...newConsole.processed],displayWorld:[48,32]}
const oldBoxIndex=projectionProps.findIndex(p=>p.id==='home-voice-box')
if(oldBoxIndex>=0)projectionProps.splice(oldBoxIndex,1)
const projection={version:1,source:'scripts/export-world.ts + src/art.ts + src/architecture.tsx',adultReference:'hero-standing',adultHeightTolerance:.12,adults:['neighbor','caretaker','clerk'],actors:[
 {id:'hero-standing',path:'public/art/rebuild-20260924/hero-sheet.png',cell:[256,0,256,256],displayWorld:[actorCellWorld,actorCellWorld]},
 ...(['neighbor','caretaker','clerk'] as const).map(id=>({id,path:`public/art/rebuild-20260924/${id}-sheet.png`,cell:[256,0,256,256],displayWorld:[actorCellWorld,actorCellWorld]})),
],walls:projectionWalls,props:projectionProps}
writeFileSync('assets/projection-audit.json',JSON.stringify(projection,null,2)+'\n')
console.log('Exported modular wall, floor, door and furniture assets with the runtime world manifest')
