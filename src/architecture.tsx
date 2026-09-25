import {useId} from 'react'
import doorWallArt from './door-wall-art.json'
import {entities,furniture,world,type Scene} from './world'
import type {Point} from './spatial/world'
import {atmosphereMode,atmospherePlacements,homeGroundClusters,type AtlasPlacement} from './atmosphere'

type Span={start:number;end:number}
export type ModuleInstance={kind:'floor'|'north-wall'|'side-wall'|'north-door'|'side-door'|'south-door'|'foreground-wall'|'desk-wood'|'desk-service'|'rug';x:number;y:number;w:number;h:number}
const W=384,H=512
export const wall={back:64,thickness:10,side:18,foreground:56}
// Scene-specific platform wall modules are continuous and may be cropped to a
// narrow central band without exposing unrelated fixtures or bright padding.
export const sideWallSource={width:256,height:1536,top:0,bottom:1536} as const
const palettes:Record<string,{cap:string;face:string;edge:string;trim:string;light:string}>={
 home:{cap:'#a9aa9d',face:'#8c918b',edge:'#384a4b',trim:'#655c50',light:'#c7b79d'},
 hall:{cap:'#929d9c',face:'#78898b',edge:'#334c55',trim:'#526469',light:'#afc7c2'},
 service:{cap:'#a9a595',face:'#818d88',edge:'#3c5152',trim:'#766948',light:'#c9c2a2'},
}
const subtract=(start:number,end:number,gaps:Span[]):Span[]=>{
 let cursor=start;const spans:Span[]=[]
 for(const gap of [...gaps].sort((a,b)=>a.start-b.start)){if(gap.start>cursor)spans.push({start:cursor,end:gap.start});cursor=Math.max(cursor,gap.end)}
 if(cursor<end)spans.push({start:cursor,end})
 return spans
}
const openings=(scene:Scene)=>{
 const doors=Object.values(entities).filter(e=>e.scene===scene&&e.kind==='door')
 const spans=(side:'N'|'E'|'S'|'W')=>doors.filter(e=>e.side===side).map(e=>side==='N'||side==='S'?{start:e.visual.x,end:e.visual.x+e.visual.w}:{start:e.visual.y,end:e.visual.y+e.visual.h})
 return {north:spans('N'),west:spans('W'),east:spans('E'),south:spans('S')}
}

/** One world layout is the source for floor, wall gaps, furniture and exported collision. */
export function architectureInstances(scene:Scene):ModuleInstance[]{
 const f=world.scenes[scene].interior,o=openings(scene),side=wall.side,southTop=f.y+f.h-wall.foreground,outerBottom=f.y+f.h+wall.thickness
 return [
  {kind:'floor',x:f.x,y:f.y,w:f.w,h:f.h},
  ...(scene==='home'?[{kind:'rug' as const,...furniture.homeRugLeft},{kind:'rug' as const,...furniture.homeRugRight},{kind:'desk-wood' as const,...furniture.voiceTable},{kind:'desk-wood' as const,...furniture.receiptTable}]:[]),
  ...(scene==='service'?[{kind:'desk-service' as const,...furniture.decisionDesk}]:scene==='archive'?[{kind:'desk-service' as const,...furniture.ledgerTable}]:[]),
  ...subtract(f.x,f.x+f.w,o.north).map(s=>({kind:'north-wall' as const,x:s.start,y:0,w:s.end-s.start,h:f.y})),
  ...o.north.map(s=>({kind:'north-door' as const,x:s.start,y:0,w:s.end-s.start,h:f.y})),
  ...subtract(0,outerBottom,o.west).map(s=>({kind:'side-wall' as const,x:f.x-side,y:s.start,w:side,h:s.end-s.start})),
  ...subtract(0,outerBottom,o.east).map(s=>({kind:'side-wall' as const,x:f.x+f.w,y:s.start,w:side,h:s.end-s.start})),
  ...o.west.map(s=>({kind:'side-door' as const,x:f.x-2*side,y:s.start,w:3*side,h:s.end-s.start})),
  ...o.east.map(s=>({kind:'side-door' as const,x:f.x+f.w-side,y:s.start,w:3*side,h:s.end-s.start})),
  ...subtract(f.x,f.x+f.w,o.south).map(s=>({kind:'foreground-wall' as const,x:s.start,y:southTop,w:s.end-s.start,h:wall.foreground+wall.thickness})),
  ...o.south.map(s=>({kind:'south-door' as const,x:s.start,y:southTop,w:s.end-s.start,h:wall.foreground+wall.thickness})),
 ]
}
const url=(name:string)=>`./art/modules/${name}.png`
/** Whole generated wall module, equal pixel scale on both axes; repeat then clip. */
function RebuiltWall({p}:{p:ModuleInstance}){
 const art=doorWallArt.find(a=>a.id==='wall-panel-root')!,scale=p.h/art.height,tileWidth=art.width*scale
 return <svg x={p.x} y={p.y} width={p.w} height={p.h} viewBox={`0 0 ${p.w} ${p.h}`} overflow="hidden">
  <rect width={p.w} height={p.h} fill="#344c52"/>
  {Array.from({length:Math.ceil(p.w/tileWidth)},(_,i)=><image key={i} href="./art/rebuild-20260924/wall-panel-root.png" x={i*tileWidth} y="0" width={tileWidth} height={p.h}/>)}
 </svg>
}
function NorthWall({p}:{p:ModuleInstance;scene:Scene}){return <g data-wall-piece="north"><RebuiltWall p={p}/></g>}
function SideWall({p,scene,end=false}:{p:ModuleInstance;scene:Scene;end?:boolean}){
 const left=p.x<world.scenes[scene].interior.x,art=doorWallArt.find(a=>a.id==='wall-panel-root')!
 // Rotate only the generated horizontal top-cap strip; keep scale uniform.
 const scale=p.w/95,length=art.width*scale
 return <g data-wall-piece={end?'door-end':'side'}>
  <svg x={p.x} y={p.y} width={p.w} height={p.h} viewBox={`0 ${p.y} ${p.w} ${p.h}`} overflow="hidden">
   <rect x="0" y={p.y} width={p.w} height={p.h} fill="#263e45"/>
   <g transform={left?undefined:`translate(${p.w} 0) scale(-1 1)`}><g transform={`translate(${p.w} 0) rotate(90)`}>
    {Array.from({length:Math.ceil(512/length)},(_,i)=><image key={i} href="./art/rebuild-20260924/wall-panel-root.png" x={i*length} y="0" width={length} height={art.height*scale}/>)}
   </g></g>
  </svg>
 </g>
}
function FrontDoor({p,side}:{p:ModuleInstance;side:'north'|'south'}){
 const art=doorWallArt.find(a=>a.id==='door-front-root-v2')!,h=p.h-5,w=h*art.width/art.height
 return <g data-door-passage={side}>
  <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="#11242a"/>
  <RebuiltWall p={{...p,w:3}}/><RebuiltWall p={{...p,x:p.x+p.w-3,w:3}}/>
  <image href="./art/rebuild-20260924/door-front-root-v2.png" x={p.x+(p.w-w)/2} y={p.y+p.h-h-2} width={w} height={h}/>
 </g>
}
function SideDoor({p,scene,foreground,actor}:{p:ModuleInstance;scene:Scene;foreground:boolean;actor?:Point}){
 const left=p.x<world.scenes[scene].interior.x
 const door=Object.values(entities).find(e=>e.scene===scene&&e.kind==='door'&&e.side===(left?'W':'E'))
 if(!door?.threshold)return null
 const floor=world.scenes[scene].interior,wallX=left?floor.x-wall.side:floor.x+floor.w
 const leafArt=doorWallArt.find(a=>a.id==='door-side-root')!
 const leafHeight=70,leafWidth=leafHeight*leafArt.width/leafArt.height,leafBaseline=p.y+4,hingeX=left?floor.x:floor.x+floor.w
 const leafLeft=left?hingeX:hingeX-leafWidth
 // The west leaf opens into the adjoining room. The east leaf opens into
 // this hall and is the only face visible here.
 const hasLeaf=!left,leafFront=Boolean(actor&&actor.y+world.actor.h<=leafBaseline+1)
 const showLeaf=hasLeaf&&foreground===leafFront
 return <g data-door-passage={left?'west':'east'} data-door-layer={foreground?'foreground':'background'}>
  {!foreground&&<>
   <svg x={wallX} y={p.y} width={wall.side} height={p.h} overflow="hidden"><image href={url('hall-ground-v3')} width={wall.side} height={p.h} preserveAspectRatio="xMidYMid slice"/></svg>
   <g data-side-passage="far-jamb"><RebuiltWall p={{...p,x:wallX,y:p.y-36,w:wall.side,h:36}}/></g>
  </>}
  {foreground&&<g data-side-passage="near-jamb"><RebuiltWall p={{...p,x:wallX,y:p.y+p.h-36,w:wall.side,h:36}}/></g>}
  {showLeaf&&<g data-side-door-leaf="open-face">
   <image href="./art/rebuild-20260924/door-side-root.png" x={leafLeft} y={leafBaseline-leafHeight} width={leafWidth} height={leafHeight}/>
  </g>}
 </g>
}
function Furniture({p}:{p:ModuleInstance}){
 if(p.kind==='desk-wood'&&p.x===furniture.voiceTable.x&&p.y===furniture.voiceTable.y)return <image href="./art/rebuild-20260924/voice-console.png" x={p.x} y={p.y+p.h-32} width={p.w} height={32} preserveAspectRatio="xMidYMax meet"/>
 if(p.kind==='rug')return <image href={url('rug')} x={p.x} y={p.y} width={p.w} height={p.h} preserveAspectRatio="xMidYMid meet"/>
 const name=p.kind==='desk-service'?'service-console-v6':'home-worktable-v5'
 return <svg x={p.x} y={p.y} width={p.w} height={p.h} viewBox="72 72 368 372" preserveAspectRatio="xMidYMid meet" overflow="hidden"><image href={url(name)} width="512" height="512"/></svg>
}
function AmbientPiece({p}:{p:AtlasPlacement}){
 const spec={
  'home-furniture':{path:'./art/ambient-home-furniture.png',cell:512,width:1024,height:1024},
  'home-props':{path:'./art/ambient-home-props.png',cell:320,width:960,height:960},
  'service-memory-chair':{path:'./art/service-memory-chair.png',cell:512,width:512,height:512},
  'service-memory-archive':{path:'./art/service-memory-archive.png',cell:512,width:512,height:512},
  'service-maintenance':{path:'./art/service-maintenance-console.png',cell:512,width:512,height:512},
 }[p.atlas]
 const [sx,sy,sw,sh]=p.source
 return <svg data-ambient-piece={p.id} x={p.rect.x} y={p.rect.y} width={p.rect.w} height={p.rect.h} viewBox={`${p.cell[0]*spec.cell+sx} ${p.cell[1]*spec.cell+sy} ${sw} ${sh}`} preserveAspectRatio="xMidYMid meet" overflow="hidden">
  <image href={spec.path} width={spec.width} height={spec.height} transform={p.flipX?`translate(${spec.width} 0) scale(-1 1)`:undefined}/>
 </svg>
}
export function SceneArchitecture({scene,foreground=false,actor,exportOnly}:{scene:Scene;foreground?:boolean;actor?:Point;exportOnly?:string}){
 const uid=useId().replace(/:/g,''),mask=`mm-wall-${uid}`,groundClip=`mm-ground-${uid}`,f=world.scenes[scene].interior,c=palettes[scene]??palettes[scene==='neighbor-room'?'home':scene==='commons'?'hall':'service'],o=openings(scene)
 const parts=architectureInstances(scene).filter(p=>foreground?p.kind==='foreground-wall'||p.kind==='south-door'||p.kind==='side-door':p.kind!=='foreground-wall'&&p.kind!=='south-door').filter(p=>!(scene==='home'&&atmosphereMode==='ground'&&p.kind==='rug'))
 return <svg className={`mm-architecture${foreground?' mm-architecture--foreground':''}`} data-scene-architecture={scene} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
  <defs><filter id="mm-hall-wall-tone" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values=".16 .50 .09 0 0  .16 .50 .09 0 .07  .16 .50 .09 0 .09  0 0 0 1 0"/></filter><filter id="mm-service-wall-tone" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values=".34 .20 .08 0 -.03  .10 .42 .18 0 -.01  .07 .24 .45 0 .05  0 0 0 1 0"/></filter>{scene==='home'&&atmosphereMode==='ground'&&<clipPath id={groundClip}>{homeGroundClusters.map(p=><rect key={p.id} {...p.clip}/>)}</clipPath>}{foreground&&<><radialGradient id={mask+'-fade'}><stop offset="0" stopColor="black"/><stop offset=".62" stopColor="black"/><stop offset="1" stopColor="white"/></radialGradient><mask id={mask}><rect width={W} height={H} fill="white"/>{actor&&actor.y>f.y+f.h-85&&<circle cx={actor.x} cy={actor.y-16} r="38" fill={`url(#${mask}-fade)`}/>}</mask></>}</defs>
  <g mask={foreground?`url(#${mask})`:undefined}>
   {parts.map((p,i)=>{
    if(exportOnly&&exportOnly!==`part-${i}`)return null
    if(p.kind==='floor')return <g key={i}><rect x={p.x} y={p.y} width={p.w} height={p.h} fill="#526f72"/><image href={(scene==='home'||scene==='neighbor-room')?'./art/rebuild-20260924/home-floor.png':url((scene==='hall'||scene==='commons')?'hall-ground-v3':'service-ground-v3')} x={p.x} y={p.y} width={p.w} height={p.h} preserveAspectRatio="xMidYMid slice"/>{scene==='home'&&atmosphereMode==='ground'&&<image href={url('home-ground-furnished-v3')} x={p.x} y={p.y} width={p.w} height={p.h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${groundClip})`}/>}<path d={`M${p.x} ${p.y}v${p.h}m${p.w} ${-p.h}v${p.h}`} stroke={c.edge} strokeWidth="3"/></g>
    if(p.kind==='rug'||p.kind==='desk-wood'||p.kind==='desk-service')return <Furniture key={i} p={p}/>
    if(p.kind==='north-wall')return <NorthWall key={i} p={p} scene={scene}/>
    if(p.kind==='side-wall')return <SideWall key={i} p={p} scene={scene} end={[...o.west,...o.east].some(g=>g.start===p.y+p.h)}/>
    if(p.kind==='north-door')return <FrontDoor key={i} p={p} side="north"/>
    if(p.kind==='side-door')return <SideDoor key={i} p={p} scene={scene} foreground={foreground} actor={actor}/>
    if(p.kind==='south-door')return <FrontDoor key={i} p={p} side="south"/>
    const outerX=p.x-(p.x===f.x?wall.side:0),outerRight=p.x+p.w+(p.x+p.w===f.x+f.w?wall.side:0),outerW=outerRight-outerX
    return <g key={i} data-wall-piece="foreground"><RebuiltWall p={{...p,x:outerX,w:outerW}}/></g>
   })}
   {!foreground&&atmosphereMode==='props'&&atmospherePlacements(scene).filter(p=>!exportOnly||exportOnly===p.id).map(p=><AmbientPiece key={p.id} p={p}/>)}
  </g>
 </svg>
}
