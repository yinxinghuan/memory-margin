import React,{useEffect,useMemo,useRef,useState} from 'react'
import {heroSheet} from './art'
import {auditPlacements,auditRoomWorld,type AuditPlacement} from './generated-room-world'
import {mapCamera} from './camera'
import {freshRoomMediaSnapshot,loadRoomMediaSnapshot,recoverRoomMedia,roomMediaAssetIds,roomMediaStorageKey,roomMediaTasks,saveRoomMediaSnapshot,type RoomMediaAssetId,type RoomMediaSnapshot} from './progressive-room-media'
import type {Point} from './spatial/world'
import type {Space} from './spatial/rpg-space'

const copy=(zh:string,en:string)=>(navigator.language.toLowerCase().startsWith('zh')?zh:en)
const art={scanner:roomMediaTasks.scanner.acceptedArt,comparator:roomMediaTasks.comparator.acceptedArt,buffer:roomMediaTasks.buffer.acceptedArt} as const
const completeAssets=new Set<RoomMediaAssetId>(roomMediaAssetIds)

function MoveIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 2v20M2 12h20M8 6l4-4 4 4M18 8l4 4-4 4M8 18l4 4 4-4M6 8l-4 4 4 4"/></svg>}
function Joystick({move}:{move:(x:number,y:number)=>void}){
 const [knob,setKnob]=useState({x:0,y:0}),active=useRef<number|null>(null)
 const update=(event:React.PointerEvent<HTMLDivElement>)=>{const box=event.currentTarget.getBoundingClientRect(),x=(event.clientX-box.left-box.width/2)/24,y=(event.clientY-box.top-box.height/2)/24,len=Math.max(1,Math.hypot(x,y));setKnob({x:x/len*15,y:y/len*15});move(x/len,y/len)}
 const stop=()=>{active.current=null;setKnob({x:0,y:0});move(0,0)}
 return <div role="group" aria-label={copy('移动摇杆','Movement joystick')} className="mm-stick" onPointerDown={event=>{active.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);update(event)}} onPointerMove={event=>{if(active.current===event.pointerId)update(event)}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><span style={{transform:`translate(${knob.x}px,${knob.y}px)`}}><MoveIcon/></span></div>
}
function Piece({item}:{item:AuditPlacement}){const [sx,sy,sw,sh]=item.source;return <svg data-audit-piece={item.id} x={item.rect.x} y={item.rect.y} width={item.rect.w} height={item.rect.h} viewBox={`${sx} ${sy} ${sw} ${sh}`} overflow="hidden"><image href={art[item.asset]} width="512" height="512"/></svg>}
function ShellPiece({item}:{item:AuditPlacement}){const label=item.id==='source-scanner'?'SOURCE':item.id==='target-scanner'?'TARGET':item.id==='comparison-console'?'COMPARE':'BUFFER';return <g data-audit-shell-piece={item.id}><rect className="mm-audit-shell-volume" x={item.rect.x} y={item.rect.y} width={item.rect.w} height={item.rect.h}/><rect className="mm-audit-shell-foot" x={item.obstacle.x} y={item.obstacle.y} width={item.obstacle.w} height={item.obstacle.h}/><text className="mm-audit-shell-label" x={item.rect.x+item.rect.w/2} y={item.rect.y+item.rect.h/2}>{label}</text></g>}
function Layer({foreground,position,readyAssets}:{foreground:boolean;position:Point;readyAssets:Set<RoomMediaAssetId>}){
 const foot=position.y+auditRoomWorld.actor.h,items=auditPlacements.filter(item=>(foot<=item.obstacle.y+item.obstacle.h)===foreground),floorReady=readyAssets.has('floor'),forming=readyAssets.size<roomMediaAssetIds.length
 return <svg className={'mm-audit-layer '+(foreground?'mm-audit-layer--foreground':'')+(forming?' mm-audit-layer--shell':'')} viewBox="0 0 384 512" aria-hidden="true">
  {!foreground&&<>
   <rect width="384" height="512" fill="#10262a"/>
   {floorReady?<image href={roomMediaTasks.floor.acceptedArt} x="54" y="62" width="276" height="390" preserveAspectRatio="none"/>:<><rect className="mm-audit-shell-floor" x="54" y="62" width="276" height="390"/><path className="mm-audit-shell-grid" d="M54 62H330V452H54z M100 62V452M146 62V452M192 62V452M238 62V452M284 62V452M54 127H330M54 192H330M54 257H330M54 322H330M54 387H330"/></>}
   <svg x="54" y="0" width="276" height="62" viewBox="0 96 768 64" preserveAspectRatio="none" overflow="hidden"><image href="./art/modules/service-wall-v4.png" width="768" height="256"/></svg>
   <svg x="38" y="0" width="16" height="452" viewBox="119.8 18 16.4 744" preserveAspectRatio="none"><image href="./art/modules/wall-side.png" width="256" height="768"/></svg>
   <svg x="330" y="0" width="16" height="452" viewBox="119.8 18 16.4 744" preserveAspectRatio="none"><image href="./art/modules/wall-side.png" width="256" height="768" transform="translate(256 0) scale(-1 1)"/></svg>
   <svg x="38" y="452" width="308" height="60" viewBox="0 98 768 60" preserveAspectRatio="none"><image href="./art/modules/wall-north.png" width="768" height="256"/></svg>
   <rect x="160" y="452" width="64" height="60" fill="#18353a"/><rect x="168" y="458" width="48" height="48" fill="#29474a" stroke="#9a8659" strokeWidth="2"/>
   {floorReady&&<g className="mm-audit-labels"><text x="74" y="92">SOURCE / 原样</text><text x="226" y="92">TARGET / 对照</text><text x="137" y="246">AUTHENTICITY / 真伪</text></g>}
  </>}
  {items.map(item=>readyAssets.has(item.asset)?<Piece key={item.id} item={item}/>:<ShellPiece key={item.id} item={item}/>)}
 </svg>
}

export function GeneratedRoomReview(){
 const params=useMemo(()=>new URLSearchParams(location.search),[]),phase=params.get('room_phase'),live=phase==='live',staticShell=phase==='shell'
 const initialMedia=useMemo<RoomMediaSnapshot>(()=>{
  if(!live)return freshRoomMediaSnapshot()
  try{if(params.get('reset_room_media')==='1')window.alteruLocalStorage.removeItem(roomMediaStorageKey);return loadRoomMediaSnapshot(window.alteruLocalStorage)}catch{return freshRoomMediaSnapshot()}
 },[live,params])
 const [media,setMedia]=useState(initialMedia),spawn={...auditRoomWorld.scenes['generated-audit-room'].spawn},[position,setPosition]=useState<Point>(spawn),[destination,setDestination]=useState<Point|null>(null),[ready,setReady]=useState(false),[mapView,setMapView]=useState({width:384,height:512}),space=useRef<Space|null>(null),keys=useRef(new Set<string>()),mapNode=useRef<HTMLDivElement|null>(null),camera=mapCamera(mapView,position)
 const readyAssets=useMemo(()=>staticShell?new Set<RoomMediaAssetId>():live?new Set(roomMediaAssetIds.filter(id=>media.assets[id].phase==='ready')):completeAssets,[live,media,staticShell]),readyCount=readyAssets.size,failedCount=live?roomMediaAssetIds.filter(id=>media.assets[id].phase==='failed').length:0,forming=readyCount<roomMediaAssetIds.length
 useEffect(()=>{if(!live)return;const controller=new AbortController();void recoverRoomMedia(initialMedia,(next)=>{try{saveRoomMediaSnapshot(window.alteruLocalStorage,next)}catch{}setMedia(next)},{signal:controller.signal}).catch(error=>{if(!controller.signal.aborted)console.error(error)});return()=>controller.abort()},[initialMedia,live])
 useEffect(()=>{let alive=true;void import('./spatial/rpg-space').then(({createRpgSpace})=>{if(!alive)return;space.current=createRpgSpace({world:auditRoomWorld,host:document.getElementById('rpg')!,scene:'generated-audit-room',position:spawn,speed:92,stride:28,poses:['step-left','step-center','step-right','step-center'],sheet:heroSheet,onPosition:point=>setPosition({...point}),onDestination:setDestination,onReady:instance=>{space.current=instance;setReady(true);instance.pause(false)},onError:console.error})});return()=>{alive=false}},[])
 useEffect(()=>{const node=mapNode.current;if(!node)return;const update=()=>setMapView({width:node.clientWidth,height:node.clientHeight});const observer=new ResizeObserver(update);observer.observe(node);update();return()=>observer.disconnect()},[])
 useEffect(()=>{const apply=()=>space.current?.move((keys.current.has('arrowright')||keys.current.has('d')?1:0)-(keys.current.has('arrowleft')||keys.current.has('a')?1:0),(keys.current.has('arrowdown')||keys.current.has('s')?1:0)-(keys.current.has('arrowup')||keys.current.has('w')?1:0));const down=(event:KeyboardEvent)=>{const key=event.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){keys.current.add(key);apply();event.preventDefault()}};const up=(event:KeyboardEvent)=>{keys.current.delete(event.key.toLowerCase());apply()};addEventListener('keydown',down);addEventListener('keyup',up);return()=>{removeEventListener('keydown',down);removeEventListener('keyup',up)}},[])
 const loadingTitle=failedCount?copy('有些细节还在路上','SOME DETAILS ARE STILL ARRIVING'):copy('世界正在加载','WORLD IS FORMING')
 return <main className="mm-app mm-app--audit" data-spatial-ui-theme="05-terminal" data-room-phase={forming?'shell':'complete'} data-space-ready={ready?'true':'false'} data-room-ready-count={readyCount} data-room-failed-count={failedCount}>
  <header className="mm-header"><div><small>{copy('记忆服务署 · 鉴定分区','MEMORY SERVICE · AUDIT ZONE')}</small><h1>{copy('记忆真伪鉴定室','Memory Authenticity Audit')}</h1></div><span className="mm-large-scale">{forming?copy('加载中','LOADING'):copy('开放','OPEN')}</span></header>
  <p className="mm-objective"><span>{forming?copy('新区域','NEW AREA'):copy('功能','FUNCTION')}</span>{forming?copy('这里已经可以探索；家具与细节还在逐步显现。','You can explore now while furniture and details take shape.'):copy('分别扫描原样与对照记忆，再由中央设备比较残响。','Scan source and target memories, then compare their residual signatures at the central device.')}</p>
  <section className="mm-stage"><div ref={mapNode} className="mm-map mm-audit-map" data-scene="generated-audit-room" onClick={event=>{if(!ready)return;const box=event.currentTarget.getBoundingClientRect();space.current?.walkTo({x:(event.clientX-box.left-camera.x)/camera.scale-4.5,y:(event.clientY-box.top-camera.y)/camera.scale-15})}}><div className="mm-audit-world" style={{transform:`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`}}><Layer foreground={false} position={position} readyAssets={readyAssets}/><div id="rpg"/><Layer foreground position={position} readyAssets={readyAssets}/>{destination&&<span className="mm-destination" style={{left:destination.x+4.5,top:destination.y+15}}/>}</div>{!ready&&<div className="mm-loading">{copy('正在打开新区域…','Opening the new area…')}</div>}{forming&&ready&&<aside className="mm-world-loading-hint" role="status" aria-live="polite"><span className="mm-world-loading-mark" aria-hidden="true"><i/><i/><i/></span><strong>{loadingTitle}</strong><small>{copy('你可以先四处看看','You can look around now')}</small></aside>}</div></section>
  <footer className="mm-controls"><Joystick move={(x,y)=>space.current?.move(x,y)}/><span className="mm-large-readout">{forming?copy('可以先四处看看','You can look around now'):copy('探索鉴定室','Explore the audit room')}<small>{copy('点击地面或使用摇杆','Tap floor or use joystick')}</small></span></footer>
 </main>
}
