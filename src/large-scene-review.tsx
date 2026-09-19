import React,{useEffect,useRef,useState} from 'react'
import {actorCellWorld,heroSheet} from './art'
import {largeDetailPackMeta,largeDetails,largeInterior,largePlacements,largeReviewWorld,largeSceneSize,largeSceneSpawns,type LargeDetail,type LargePlacement} from './large-scene-world'
import type {Point} from './spatial/world'
import type {Space} from './spatial/rpg-space'

const copy=(zh:string,en:string)=>(navigator.language.toLowerCase().startsWith('zh')?zh:en)
const assetSpec={
 'service-console':{path:'./art/modules/service-console-v6.png',width:512,height:512},
 'memory-chair':{path:'./art/service-memory-chair.png',width:512,height:512},
 'memory-archive':{path:'./art/service-memory-archive.png',width:512,height:512},
 'maintenance-console':{path:'./art/service-maintenance-console.png',width:512,height:512},
} as const

function MoveIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 2v20M2 12h20M8 6l4-4 4 4M18 8l4 4-4 4M8 18l4 4 4-4M6 8l-4 4 4 4"/></svg>}
function ReviewJoystick({move}:{move:(x:number,y:number)=>void}){
 const [knob,setKnob]=useState({x:0,y:0}),active=useRef<number|null>(null)
 const update=(e:React.PointerEvent<HTMLDivElement>)=>{const box=e.currentTarget.getBoundingClientRect(),x=(e.clientX-box.left-box.width/2)/24,y=(e.clientY-box.top-box.height/2)/24,len=Math.max(1,Math.hypot(x,y));setKnob({x:x/len*15,y:y/len*15});move(x/len,y/len)}
 const stop=()=>{active.current=null;setKnob({x:0,y:0});move(0,0)}
 return <div role="group" aria-label={copy('移动摇杆','Movement joystick')} className="mm-stick" onPointerDown={e=>{active.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e)}} onPointerMove={e=>{if(active.current===e.pointerId)update(e)}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><span style={{transform:`translate(${knob.x}px,${knob.y}px)`}}><MoveIcon/></span></div>
}
function Piece({p}:{p:LargePlacement}){
 const spec=assetSpec[p.asset],[sx,sy,sw,sh]=p.source
 return <svg className="mm-large-piece" data-large-piece={p.id} data-zone={p.zone} x={p.rect.x} y={p.rect.y} width={p.rect.w} height={p.rect.h} viewBox={`${sx} ${sy} ${sw} ${sh}`} preserveAspectRatio="xMidYMid meet" overflow="hidden"><image href={spec.path} width={spec.width} height={spec.height}/></svg>
}
function Detail({detail}:{detail:LargeDetail}){const [col,row]=detail.cell;return <svg className={`mm-large-piece mm-large-detail mm-large-detail--${detail.kind}`} data-large-detail={detail.id} data-detail-source={detail.source} data-zone={detail.zone} x={detail.rect.x} y={detail.rect.y} width={detail.rect.w} height={detail.rect.h} viewBox={`${col*320} ${row*320} 320 320`} preserveAspectRatio="xMidYMid meet" overflow="hidden"><image href={detail.atlas} width="960" height="960"/></svg>}
function LargeLayer({foreground,position}:{foreground:boolean;position:Point}){
 const actorFoot=position.y+largeReviewWorld.actor.h
 const pieces=largePlacements.filter(p=>(actorFoot<=p.obstacle.y+p.obstacle.h)===foreground)
 const details=largeDetails.filter(detail=>detail.kind==='furniture'&&detail.obstacle&&(actorFoot<=detail.obstacle.y+detail.obstacle.h)===foreground)
 return <svg className={'mm-large-layer '+(foreground?'mm-large-layer--foreground':'')} viewBox={`0 0 ${largeSceneSize.width} ${largeSceneSize.height}`} aria-hidden="true">
  {!foreground&&<>
   <rect width="768" height="768" fill="#11272a"/>
   <image href="./art/modules/large-concourse-ground-v1.png" x={largeInterior.x} y={largeInterior.y} width={largeInterior.w} height={largeInterior.h} preserveAspectRatio="none"/>
   <svg x={largeInterior.x} y="0" width={largeInterior.w} height={largeInterior.y} viewBox="0 98.7 768 58.6" preserveAspectRatio="none" overflow="hidden"><image href="./art/modules/service-wall-v4.png" width="768" height="256"/></svg>
   <svg x="14" y="0" width="16" height="724" viewBox="119.8 18 16.4 744" preserveAspectRatio="none" overflow="hidden"><image href="./art/modules/wall-side.png" width="256" height="768"/></svg>
   <svg x="738" y="0" width="16" height="724" viewBox="119.8 18 16.4 744" preserveAspectRatio="none" overflow="hidden"><image href="./art/modules/wall-side.png" width="256" height="768" transform="translate(256 0) scale(-1 1)"/></svg>
   <svg x="14" y="724" width="740" height="44" viewBox="0 105 768 45.7" preserveAspectRatio="none" overflow="hidden"><image href="./art/modules/wall-north.png" width="768" height="256"/></svg>
   <rect x="328" y="724" width="112" height="44" fill="#18353a"/><rect x="340" y="728" width="88" height="36" fill="#29474a" stroke="#9a8659" strokeWidth="2"/>
   <g className="mm-large-zones"><text x="316" y="76">OBSERVATION / 观察</text><text x="76" y="137">ACCESS / 接入</text><text x="545" y="151">MAINTENANCE / 检修</text><text x="318" y="302">ROUTER / 路由</text><text x="315" y="692">ARRIVAL / 登记</text></g>
   {largeDetails.filter(detail=>detail.kind==='trace').map(detail=><Detail key={detail.id} detail={detail}/>)}
  </>}
  {pieces.map(p=><Piece key={p.id} p={p}/>)}
  {details.map(detail=><Detail key={detail.id} detail={detail}/>)}
 </svg>
}

function cameraFor(view:{width:number;height:number},position:Point){
 const scale=Math.max(.8,Math.min(.94,view.width/430)),width=largeSceneSize.width*scale,height=largeSceneSize.height*scale
 const x=Math.max(view.width-width,Math.min(0,view.width/2-(position.x+4.5)*scale))
 const y=Math.max(view.height-height,Math.min(0,view.height*.64-(position.y+15)*scale))
 return {x,y,scale}
}

export function LargeSceneReview(){
 const requested=new URLSearchParams(location.search).get('area') as keyof typeof largeSceneSpawns|null
 const spawn={...(requested&&largeSceneSpawns[requested]||largeSceneSpawns.south)}
 const [position,setPosition]=useState<Point>(spawn),[destination,setDestination]=useState<Point|null>(null),[ready,setReady]=useState(false),[mapView,setMapView]=useState({width:390,height:620})
 const space=useRef<Space|null>(null),mapNode=useRef<HTMLDivElement|null>(null),keys=useRef(new Set<string>())
 const camera=cameraFor(mapView,position)
 useEffect(()=>{let alive=true;void import('./spatial/rpg-space').then(({createRpgSpace})=>{if(!alive)return;space.current=createRpgSpace({world:largeReviewWorld,host:document.getElementById('rpg')!,scene:'large-review',position:spawn,speed:104,stride:28,poses:['step-left','step-center','step-right','step-center'],sheet:heroSheet,onPosition:p=>setPosition({...p}),onDestination:setDestination,onReady:s=>{space.current=s;setReady(true);s.pause(false)},onError:console.error})});return()=>{alive=false}},[])
 useEffect(()=>{const node=mapNode.current;if(!node)return;const update=()=>setMapView({width:node.clientWidth,height:node.clientHeight});const observer=new ResizeObserver(update);observer.observe(node);update();return()=>observer.disconnect()},[])
 useEffect(()=>{const apply=()=>space.current?.move((keys.current.has('arrowright')||keys.current.has('d')?1:0)-(keys.current.has('arrowleft')||keys.current.has('a')?1:0),(keys.current.has('arrowdown')||keys.current.has('s')?1:0)-(keys.current.has('arrowup')||keys.current.has('w')?1:0));const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){keys.current.add(k);apply();e.preventDefault()}};const up=(e:KeyboardEvent)=>{keys.current.delete(e.key.toLowerCase());apply()};window.addEventListener('keydown',down);window.addEventListener('keyup',up);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)}},[])
 return <main className="mm-app mm-app--large" data-spatial-ui-theme="05-terminal" data-detail-pack-ready={String(largeDetailPackMeta.generatedReady)}><header className="mm-header"><div><small>{copy('大场景试验 · 动态细节包','LARGE SCENE STUDY · DYNAMIC DETAIL PACK')}</small><h1>{copy('记忆交换大厅','Memory Exchange Concourse')}</h1></div><span className="mm-large-scale">768×768</span></header>
  <p className="mm-objective"><span>{copy('试验','TEST')}</span>{copy('穿过多个功能区，观察方向感、密度与镜头移动。','Cross several functional zones and judge orientation, density, and camera travel.')}</p>
  <section className="mm-stage"><div ref={mapNode} className="mm-map mm-large-map" data-scene="large-review" onClick={e=>{if(!ready||(e.target as HTMLElement).closest('button'))return;const box=e.currentTarget.getBoundingClientRect(),target={x:(e.clientX-box.left-camera.x)/camera.scale-4.5,y:(e.clientY-box.top-camera.y)/camera.scale-15};space.current?.walkTo(target)}}>
   <div className="mm-large-world" style={{transform:`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`}}>
    <LargeLayer foreground={false} position={position}/><div id="rpg"/><LargeLayer foreground position={position}/>
    {destination&&<span className="mm-destination" style={{left:destination.x+4.5,top:destination.y+15}}/>}
   </div>{!ready&&<div className="mm-loading">{copy('正在铺开大厅…','Opening the concourse…')}</div>}
  </div></section>
  <footer className="mm-controls"><ReviewJoystick move={(x,y)=>space.current?.move(x,y)}/><span className="mm-large-readout">{copy('点击地面或使用摇杆','Tap floor or use joystick')}<small>{Math.round(position.x)} · {Math.round(position.y)}</small></span></footer>
 </main>
}
