import {useId} from 'react'
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
const palettes:Record<Scene,{cap:string;face:string;edge:string;trim:string;light:string}>={
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
  ...(scene==='service'?[{kind:'desk-service' as const,...furniture.ledgerTable},{kind:'desk-service' as const,...furniture.decisionDesk}]:[]),
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
function NorthWall({p,scene}:{p:ModuleInstance;scene:Scene}){
 const c=palettes[scene],base=p.y+p.h,f=world.scenes[scene].interior
 const art=scene==='home'?'home-wall-v5':scene==='hall'?'hall-wall-v4':'service-wall-v4'
 const sx=(p.x-f.x)/f.w*768,sw=p.w/f.w*768
 // The source is 768×256; a 276×64 wall would stretch it by 44%.
 // Crop its height to keep one source pixel the same size on both axes.
 const cropH=sw*p.h/p.w,cropY=(256-cropH)/2
 return <g data-wall-piece="north">
  <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={c.face}/>
  <svg x={p.x} y={p.y} width={p.w} height={p.h} viewBox={`${sx} ${cropY} ${sw} ${cropH}`} preserveAspectRatio="none" overflow="hidden"><image href={url(art)} width="768" height="256" filter={scene==='service'?'url(#mm-service-wall-tone)':undefined}/></svg>
  <rect x={p.x} y={p.y} width={p.w} height="6" fill={c.cap}/>
  <path d={`M${p.x} ${p.y+1}h${p.w}`} stroke={c.light} opacity=".55"/>
  <rect x={p.x} y={base-5} width={p.w} height="5" fill={c.trim}/>
  <path d={`M${p.x} ${base}h${p.w}`} stroke={c.edge} strokeWidth="1.5"/>
  <rect x={p.x} y={base} width={p.w} height="7" fill="#101f28" opacity=".45"/>
  <path d={`M${p.x} ${p.y}v${p.h}M${p.x+p.w} ${p.y}v${p.h}`} stroke={c.edge} strokeWidth="1.5"/>
 </g>
}
function SideWall({p,scene,end=false}:{p:ModuleInstance;scene:Scene;end?:boolean}){
 const c=palettes[scene],floor=world.scenes[scene].interior,left=p.x<floor.x,outerBottom=floor.y+floor.h+wall.thickness
 const scale=outerBottom/(sideWallSource.bottom-sideWallSource.top)
 const imageX=p.x+p.w/2-sideWallSource.width*scale/2,imageY=-sideWallSource.top*scale
 return <g data-wall-piece={end?'door-end':'side'}>
  <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={c.face}/>
  <svg x={p.x} y={p.y} width={p.w} height={p.h} viewBox={`${p.x} ${p.y} ${p.w} ${p.h}`} overflow="hidden"><image href={url(`${scene}-side-wall-v7`)} x={imageX} y={imageY} width={sideWallSource.width*scale} height={sideWallSource.height*scale} opacity=".88" transform={!left?`translate(${2*p.x+p.w} 0) scale(-1 1)`:undefined}/></svg>
  <path d={`M${left?p.x+p.w:p.x} ${p.y}v${p.h}`} stroke={c.edge} strokeWidth="1.25" opacity=".75"/>
  <path d={`M${left?p.x:p.x+p.w} ${p.y}v${p.h}`} stroke={c.edge} strokeWidth=".75" opacity=".3"/>
 </g>
}
function FrontDoor({p,side}:{p:ModuleInstance;side:'north'|'south'}){
 const threshold=p.y+p.h,scale=64/384
 const x=p.x+p.w/2-195*scale,y=threshold-455*scale
 return <svg data-door-passage={side} x={x} y={y} width={384*scale} height={512*scale} viewBox="384 0 384 512" overflow="hidden">
  <image href={url('door-front-atlas-v3')} width="768" height="512"/>
 </svg>
}
function SideDoor({p,scene,foreground,actor}:{p:ModuleInstance;scene:Scene;foreground:boolean;actor?:Point}){
 const left=p.x<world.scenes[scene].interior.x
 const door=Object.values(entities).find(e=>e.scene===scene&&e.kind==='door'&&e.side===(left?'W':'E'))
 if(!door?.threshold)return null
 const uid=useId().replace(/:/g,''),nearClip=`mm-side-near-${uid}`
 const passageScale=p.h/251,anchorX=door.threshold.x+(left?-4:4),anchorY=door.threshold.y
 const leafWidth=36,leafHeight=70,leafBaseline=p.y+4,hingeX=left?p.x+p.w-12:p.x+12
 const leafLeft=left?hingeX:hingeX-leafWidth
 // The west leaf opens into the adjoining room. The east leaf opens into
 // this hall and is the only face visible here.
 const hasLeaf=!left,leafFront=Boolean(actor&&actor.y+world.actor.h<=leafBaseline+1)
 const showLeaf=hasLeaf&&foreground===leafFront
 return <g data-door-passage={left?'west':'east'} data-door-layer={foreground?'foreground':'background'}>
  <defs><clipPath id={nearClip}><rect x="349" y="313" width="71" height="122"/></clipPath></defs>
  {!foreground&&<>
   <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="#263f47"/>
   <g transform={`translate(${anchorX} ${anchorY}) scale(${passageScale}) translate(-384 -307.5)`}>
    <image href={url('door-side-passage-v3')} width="768" height="512"/>
   </g>
  </>}
  {foreground&&<g data-side-passage="near-jamb" transform={`translate(${anchorX} ${anchorY}) scale(${passageScale}) translate(-384 -307.5)`}>
   <image href={url('door-side-passage-v3')} width="768" height="512" clipPath={`url(#${nearClip})`}/>
  </g>}
  {showLeaf&&<g data-side-door-leaf="open-face">
   <rect x={leafLeft} y={leafBaseline-leafHeight-2} width={leafWidth} height="2.5" fill="#8fa7ad" stroke="#263b43" strokeWidth=".6"/>
   <svg x={leafLeft} y={leafBaseline-leafHeight} width={leafWidth} height={leafHeight} viewBox="78 66 350 634" preserveAspectRatio="none" overflow="visible">
    <image href={url('door-side-leaf-v5')} width="512" height="768"/>
   </svg>
  </g>}
 </g>
}
function Furniture({p}:{p:ModuleInstance}){
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
export function SceneArchitecture({scene,foreground=false,actor}:{scene:Scene;foreground?:boolean;actor?:Point}){
 const uid=useId().replace(/:/g,''),mask=`mm-wall-${uid}`,groundClip=`mm-ground-${uid}`,f=world.scenes[scene].interior,c=palettes[scene],o=openings(scene)
 const parts=architectureInstances(scene).filter(p=>foreground?p.kind==='foreground-wall'||p.kind==='south-door'||p.kind==='side-door':p.kind!=='foreground-wall'&&p.kind!=='south-door').filter(p=>!(scene==='home'&&atmosphereMode==='ground'&&p.kind==='rug'))
 return <svg className={`mm-architecture${foreground?' mm-architecture--foreground':''}`} data-scene-architecture={scene} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
  <defs><filter id="mm-hall-wall-tone" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values=".16 .50 .09 0 0  .16 .50 .09 0 .07  .16 .50 .09 0 .09  0 0 0 1 0"/></filter><filter id="mm-service-wall-tone" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values=".34 .20 .08 0 -.03  .10 .42 .18 0 -.01  .07 .24 .45 0 .05  0 0 0 1 0"/></filter>{scene==='home'&&atmosphereMode==='ground'&&<clipPath id={groundClip}>{homeGroundClusters.map(p=><rect key={p.id} {...p.clip}/>)}</clipPath>}{foreground&&<><radialGradient id={mask+'-fade'}><stop offset="0" stopColor="black"/><stop offset=".62" stopColor="black"/><stop offset="1" stopColor="white"/></radialGradient><mask id={mask}><rect width={W} height={H} fill="white"/>{actor&&actor.y>f.y+f.h-85&&<circle cx={actor.x} cy={actor.y-16} r="38" fill={`url(#${mask}-fade)`}/>}</mask></>}</defs>
  <g mask={foreground?`url(#${mask})`:undefined}>
   {parts.map((p,i)=>{
    if(p.kind==='floor')return <g key={i}><rect x={p.x} y={p.y} width={p.w} height={p.h} fill="#526f72"/><image href={url(scene==='home'?'home-ground-v4':scene==='hall'?'hall-ground-v3':'service-ground-v3')} x={p.x} y={p.y} width={p.w} height={p.h} preserveAspectRatio="xMidYMid slice"/>{scene==='home'&&atmosphereMode==='ground'&&<image href={url('home-ground-furnished-v3')} x={p.x} y={p.y} width={p.w} height={p.h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${groundClip})`}/>}<path d={`M${p.x} ${p.y}v${p.h}m${p.w} ${-p.h}v${p.h}`} stroke={c.edge} strokeWidth="3"/></g>
    if(p.kind==='rug'||p.kind==='desk-wood'||p.kind==='desk-service')return <Furniture key={i} p={p}/>
    if(p.kind==='north-wall')return <NorthWall key={i} p={p} scene={scene}/>
    if(p.kind==='side-wall')return <SideWall key={i} p={p} scene={scene} end={[...o.west,...o.east].some(g=>g.start===p.y+p.h)}/>
    if(p.kind==='north-door')return <FrontDoor key={i} p={p} side="north"/>
    if(p.kind==='side-door')return <SideDoor key={i} p={p} scene={scene} foreground={foreground} actor={actor}/>
    if(p.kind==='south-door')return <FrontDoor key={i} p={p} side="south"/>
    const outerX=p.x-(p.x===f.x?wall.side:0),outerRight=p.x+p.w+(p.x+p.w===f.x+f.w?wall.side:0),outerW=outerRight-outerX
    return <g key={i} data-wall-piece="foreground"><rect x={outerX} y={p.y} width={outerW} height={p.h} fill={c.face}/><image href={url('wall-north')} x={p.x} y={p.y+wall.thickness} width={p.w} height={p.h-wall.thickness} preserveAspectRatio="xMidYMid slice" opacity=".78" filter={scene==='hall'?'url(#mm-hall-wall-tone)':undefined}/><rect x={outerX} y={p.y} width={outerW} height={wall.thickness} fill={c.cap}/><path d={`M${outerX} ${p.y}h${outerW}M${outerX} ${p.y+wall.thickness}h${outerW}M${outerX} ${p.y+p.h}h${outerW}`} stroke={c.edge} strokeWidth="2"/><path d={`M${outerX+2} ${p.y+3}h${Math.max(0,outerW-4)}`} stroke={c.light} opacity=".6"/><rect x={outerX} y={p.y+p.h-8} width={outerW} height="8" fill={c.trim}/><path d={`M${outerX} ${p.y}v${p.h}M${outerRight} ${p.y}v${p.h}`} stroke={c.edge} strokeWidth="2"/></g>
   })}
   {!foreground&&atmosphereMode==='props'&&atmospherePlacements(scene).map(p=><AmbientPiece key={p.id} p={p}/>)}
  </g>
 </svg>
}
