import {discoveries,discoveryRecords,explorationComplete,discoveryArt,chapterLabel} from './exploration'
import './game-id'
import {recordIdForEntity,panelDescription,actionBlockReason} from './interaction-presentation'
import React,{useEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {JourneyStore} from './storage'
import {PendingJourney,performPending,recoverPending} from './pending-journey'
import {type Head,type Action} from './journey'
import {entities,entityNear,world,sceneLabels,type EntityId,type Scene} from './world'
import {heroSheet,actorCellWorld,actorFootFraction,worldPropCell} from './art'
import {createForegroundReveal,sceneSheets,sceneEvents,prepareScene,projectResident,updateSceneVisualState} from './rpg-visuals'
import {t,objective,openingNarration,type Locale} from './story'
import {advanceFootstepAudio,playCue,resetFootstepAudio,setSoundMuted,startGameAudio,type Cue} from './sound'
import type {Space} from './spatial/rpg-space'
import type {Point} from './spatial/world'
import {mapCamera} from './camera'
import {interactionVerb,primaryInteractionIntent,stableNearby} from './nearby-interaction'
import {LargeSceneReview} from './large-scene-review'
import {GeneratedRoomReview} from './generated-room-review'
import {MemoryBackpack,MemoryMap,MemoryMenu,type ShellTab} from './experience-shell'
import {conversationName,conversationPages,conversationTopics} from './conversation'
import {NpcResidentMotion,type NpcMotionState} from './npc-motion'
import {characterConversation} from './conversation-history'
import {detectLocale} from './locale'
import {requestDialogue} from './free-dialogue'
import './style.css'

document.documentElement.dataset.release='memory-seven-places-20260926-r1'

const initialLocale:Locale=detectLocale(new URLSearchParams(location.search).get('lang'),navigator.languages?.length?navigator.languages:[navigator.language])
type Dialog=EntityId|'backpack'|'map'|'menu'|'result'|null
const actionCopy:Record<string,[string,string]>={
 ...Object.fromEntries(discoveries.map(d=>[d.action,[...d.label]])),
 'listen-voice':['播放这段语音','Play the voice'], 'revisit-voice':['再听一次','Play it again'], 'read-receipt':['读回执','Read receipt'],
 'to-hall':['走进走廊','Enter the hall'],'to-home':['回居所','Return home'],'talk-neighbor':['跟她说话','Talk to her'],'talk-caretaker':['问值守人','Ask the attendant'],'read-seal':['查看封签','Read the seal'],
 'to-service':['进入服务点','Enter memory service'],'service-to-hall':['回走廊','Return to the hall'],'talk-clerk':['问窗口职员','Ask the clerk'],'read-ledger':['读公开记录','Read the register'],
 'compare-records':['核对三处记录','Compare three sources'],'choose-keep':['撤下借用，取回结尾','Withdraw lending, recover ending'],'choose-lend':['借出 30 天，保留空位','Lend for 30 days, free a slot'],'inspect-decision':['查看处理结果','Read the decision']
 ,'read-breakfast':['读早餐便条','Read breakfast note'],'read-hall-notice':['看看走廊告示','Read hall notice'],'read-terms':['读服务说明','Read service terms'],
 'try-save-morning':['试着留下今早的印象','Try to keep this morning'],'save-morning':['把今早的印象留在空位','Keep this morning in the free slot'],
 'ask-neighbor-preview':['问她听见的声音','Ask about the voice'],'read-preview-log':['查看播放记录','Read playback log'],'confront-clerk-preview':['问她为何外放','Ask about playback'],'ask-caretaker-preview':['问封签为何没拦住','Ask about the seal'],'stop-preview':['关闭公开预览','Stop public previews'],'trace-preview':['再播一次，追查账户','Play once more, trace account'],'debrief-neighbor':['告诉她窗口的结果','Tell her what happened']
}
const objectCell:Record<string,string>=Object.fromEntries(Object.entries(worldPropCell).map(([id,[col,row]])=>[id,`${col*50}% ${row*50}%`]))
const personIds=['neighbor','caretaker','clerk'] as const
const personOrigins=Object.fromEntries(personIds.map(id=>{const e=entities[id],foot={x:e.visual.x+e.visual.w/2,y:e.visual.y+e.visual.h};return[id,{foot,visual:{...e.visual},approach:{...e.approach},obstacle:e.obstacle?{...e.obstacle}:undefined}]})) as Record<typeof personIds[number],{foot:Point;visual:typeof entities.neighbor.visual;approach:Point;obstacle?:typeof entities.neighbor.obstacle}>
const overlaps=(a:{x:number;y:number;w:number;h:number},b:{x:number;y:number;w:number;h:number})=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y
function placeResident(id:typeof personIds[number],state:NpcMotionState){const e=entities[id],origin=personOrigins[id],dx=state.position.x-origin.foot.x,dy=state.position.y-origin.foot.y;e.visual.x=origin.visual.x+dx;e.visual.y=origin.visual.y+dy;e.approach.x=origin.approach.x+dx;e.approach.y=origin.approach.y+dy;if(e.obstacle&&origin.obstacle){e.obstacle.x=origin.obstacle.x+dx;e.obstacle.y=origin.obstacle.y+dy}}
function residentWalkable(id:typeof personIds[number],point:Point,hero:Point){const e=entities[id],origin=personOrigins[id],body={x:(origin.obstacle?.x??origin.visual.x)+(point.x-origin.foot.x),y:(origin.obstacle?.y??origin.visual.y)+(point.y-origin.foot.y),w:origin.obstacle?.w??origin.visual.w,h:origin.obstacle?.h??origin.visual.h},interior=world.scenes[e.scene].interior,heroBody={x:hero.x,y:hero.y,w:world.actor.w,h:world.actor.h};return body.x>=interior.x&&body.y>=interior.y&&body.x+body.w<=interior.x+interior.w&&body.y+body.h<=interior.y+interior.h&&!overlaps(body,heroBody)&&!world.scenes[e.scene].obstacles.some(obstacle=>obstacle!==e.obstacle&&overlaps(body,obstacle))}
function Icon({name}:{name:'record'|'people'|'map'|'bag'|'menu'|'close'|'arrow'|'move'|'expand'|'sound'|'mute'}){
 const paths={record:'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',people:'M16 20v-2a4 4 0 0 0-8 0v2M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',bag:'M7 7V5a5 5 0 0 1 10 0v2M4 8h16l-1 13H5L4 8Zm5 0V5a3 3 0 0 1 6 0v3',menu:'M4 6h16M4 12h16M4 18h16',close:'M5 5l14 14M19 5 5 19',arrow:'M4 12h15m-6-6 6 6-6 6',move:'M12 2v20M2 12h20M8 6l4-4 4 4M18 8l4 4-4 4M8 18l4 4 4-4M6 8l-4 4 4 4',expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',sound:'M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8m2-11a10 10 0 0 1 0 14',mute:'M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6'}
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true"><path d={paths[name]}/></svg>
}
function Joystick({move,label}:{move:(x:number,y:number)=>void;label:string}){
 const [knob,setKnob]=useState({x:0,y:0}),active=useRef<number|null>(null)
 const update=(e:React.PointerEvent<HTMLDivElement>)=>{const box=e.currentTarget.getBoundingClientRect(),x=(e.clientX-box.left-box.width/2)/24,y=(e.clientY-box.top-box.height/2)/24,len=Math.max(1,Math.hypot(x,y));setKnob({x:x/len*15,y:y/len*15});move(x/len,y/len)}
 const stop=()=>{active.current=null;setKnob({x:0,y:0});move(0,0)}
 return <div role="group" aria-label={label} className="mm-stick" onPointerDown={e=>{active.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e)}} onPointerMove={e=>{if(active.current===e.pointerId)update(e)}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><span style={{transform:`translate(${knob.x}px,${knob.y}px)`}}><Icon name="move"/></span></div>
}

function PortraitViewer({id,name,closeLabel,onClose}:{id:string;name:string;closeLabel:string;onClose:()=>void}){
 const modal=useRef<HTMLDialogElement>(null)
 useEffect(()=>{modal.current?.showModal()},[])
 return <dialog ref={modal} className="mm-portrait-viewer" aria-label={name} onClose={onClose} onClick={event=>{if(event.target===event.currentTarget)modal.current?.close()}}><section><header><h2>{name}</h2><button autoFocus aria-label={closeLabel} onClick={()=>modal.current?.close()}><Icon name="close"/></button></header><div className="mm-portrait mm-portrait-large" data-character={id} style={{backgroundImage:`url('./art/rebuild-20260924/${id}-portrait.png')`,backgroundSize:'cover',backgroundPosition:'center'}} role="img" aria-label={name}/></section></dialog>
}
function App(){
 const [historyLimit,setHistoryLimit]=useState(8)
 const [head,setHead]=useState<Head|null>(null),[position,setPosition]=useState<Point>(world.scenes.home.spawn),[destination,setDestination]=useState<Point|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[openingOpen,setOpeningOpen]=useState(false),[dialog,setDialog]=useState<Dialog>(null),[focusId,setFocusId]=useState<EntityId|null>(null),[zoom,setZoom]=useState<string|null>(null),[message,setMessage]=useState(''),[error,setError]=useState(''),[hypothesis,setHypothesis]=useState<'transfer-error'|'queued-lending'|null>(null),[confirmation,setConfirmation]=useState<'choose-keep'|'choose-lend'|'stop-preview'|'trace-preview'|null>(null)
 const [backpackTab,setBackpackTab]=useState<ShellTab>('goal'),[conversationReply,setConversationReply]=useState<{player:string;speaker:string;text:string}|null>(null),[conversationInput,setConversationInput]=useState('')
 const chatRequest=useRef<AbortController|null>(null),composing=useRef(false),drafts=useRef<Partial<Record<EntityId,string>>>({})
 const [chatError,setChatError]=useState(''),[composerOpen,setComposerOpen]=useState(false)
 const [conversationPhase,setConversationPhase]=useState<'choices'|'waiting'|'reply'>('choices'),[conversationPage,setConversationPage]=useState(0),[conversationGroup,setConversationGroup]=useState<'more'|'share'|null>(null)
 const [mapView,setMapView]=useState({width:384,height:512}),[busyKind,setBusyKind]=useState<'initial'|'action'|'transition'|'recovery'>('initial')
 const [muted,setMuted]=useState(()=>{try{return window.alteruLocalStorage.getItem('memory-margin-muted')==='1'}catch{return false}})
 const current=useRef<Head|null>(null),store=useRef<JourneyStore|null>(null),journal=useRef<PendingJourney|null>(null),space=useRef<Space|null>(null),busyRef=useRef(false),mutedRef=useRef(muted),keys=useRef(new Set<string>()),mapNode=useRef<HTMLDivElement|null>(null),preferredTarget=useRef<EntityId|null>(null),positionRef=useRef(position),sceneRef=useRef<Scene>('home'),selectedRef=useRef<EntityId|null>(null),residentPaused=useRef(true),residentRevision=useRef(0)
 const residents=useRef({neighbor:new NpcResidentMotion({home:personOrigins.neighbor.foot,axis:'x',radius:22,speed:18,restSeconds:2.6,attentionDistance:76}),caretaker:new NpcResidentMotion({home:personOrigins.caretaker.foot,axis:'y',radius:10,speed:12,restSeconds:3.4,attentionDistance:70}),clerk:new NpcResidentMotion({home:personOrigins.clerk.foot,axis:'x',radius:0,speed:0,restSeconds:0,attentionDistance:68})})
 const [,paintResidents]=useState(0)
 const approachingTarget=useRef<EntityId|null>(null)
 const locale=head?.save.locale??initialLocale,copy=(zh:string,en:string)=>t(locale,zh,en),scene:Scene=head?.scene??'home',facts=head?.save.facts??{}
 sceneRef.current=scene;mutedRef.current=muted
 const worldNode=useRef<HTMLDivElement|null>(null),mapViewRef=useRef(mapView),lastPositionPaint=useRef(0)
 mapViewRef.current=mapView
 const camera=mapCamera(mapView,positionRef.current)
 const projectPosition=(p:Point)=>{
  positionRef.current={...p}
  const nextCamera=mapCamera(mapViewRef.current,p)
  if(worldNode.current)worldNode.current.style.transform=`translate3d(${nextCamera.x}px,${nextCamera.y}px,0) scale(${nextCamera.scale})`
  const now=performance.now();if(now-lastPositionPaint.current>=80){lastPositionPaint.current=now;setPosition({...p})}
 }
 const setCurrent=(h:Head)=>{current.current=h;setHead(h)}
 function resetConversation(){chatRequest.current?.abort();chatRequest.current=null;setComposerOpen(false);setChatError('');setConversationReply(null);setConversationInput('');setConversationPhase('choices');setConversationPage(0);setConversationGroup(null)}
 const apply=async(request:Action)=>{
  if(busyRef.current||!store.current||!journal.current||!space.current)return
  busyRef.current=true;setBusyKind(request.action.startsWith('map-travel:')||entities[request.entity]?.kind==='door'?'transition':'action');setBusy(true);space.current.pause(true);setError('')
  try{await performPending(store.current,journal.current,request,locale,async result=>{if(result.reconciled||space.current!.scene()!==result.head.scene){resetFootstepAudio();await space.current!.restore(result.head.scene,result.head.position)}setCurrent(result.head);setMessage(result.text);if(result.accepted&&!result.reconciled){const cue:Cue=request.action==='debrief-neighbor'?'complete':['choose-keep','choose-lend','stop-preview','trace-preview'].includes(request.action)?'choice':['read-preview-log','ask-neighbor-preview','compare-records'].includes(request.action)?'reveal':['try-save-morning','confront-clerk-preview','ask-caretaker-preview'].includes(request.action)?'warning':request.action==='listen-voice'?'fracture':request.action.startsWith('read-')||request.action==='revisit-voice'?'read':'tap';playCue(cue,muted)}if(result.reconciled||result.head.scene!==request.scene){setDialog(null);setZoom(null);resetConversation()}})}
  catch(e){console.error(e);setError(copy('操作尚未确认。重试会恢复同一次操作。','Action not confirmed. Retry restores the same operation.'))}
  finally{busyRef.current=false;setBusy(false)}
 }
 const retry=async()=>{if(!store.current||!journal.current||!space.current){location.reload();return}if(busyRef.current)return;busyRef.current=true;setBusyKind('recovery');setBusy(true);try{const h=await recoverPending(store.current,journal.current,locale,async r=>{resetFootstepAudio();await space.current!.restore(r.head.scene,r.head.position);setCurrent(r.head);setMessage(r.text)});resetFootstepAudio();await space.current.restore(h.scene,h.position);setCurrent(h);setDialog(null);setZoom(null);resetConversation();setError('')}catch(e){console.error(e);setError(copy('暂时不能读取旅程。存储恢复后请重试。','Journey storage is unavailable. Retry when storage recovers.'))}finally{busyRef.current=false;setBusy(false)}}
 const act=(entity:EntityId,action:string)=>{const h=current.current;if(!h||!space.current)return;playCue('tap',muted);void apply({id:crypto.randomUUID(),version:h.version,scene:h.scene,entity,action,position:space.current.position()})}
 useEffect(()=>{let alive=true;void(async()=>{try{store.current=await JourneyStore.open();journal.current=new PendingJourney(window.alteruLocalStorage);const h=await recoverPending(store.current,journal.current,initialLocale);if(!alive)return;setCurrent(h);positionRef.current=h.position;setPosition(h.position);setOpeningOpen(h.version===0);const {createRpgSpace}=await import('./spatial/rpg-space');space.current=createRpgSpace({world,host:document.getElementById('rpg')!,scene:h.scene,position:h.position,speed:82,stride:56,poses:['step-left','step-center','step-right','step-center'],sheet:heroSheet,spritesheets:sceneSheets,mapEvents:sceneEvents,prepareScene,onFrame:createForegroundReveal(),onPosition:projectPosition,onTravel:distance=>advanceFootstepAudio(distance,mutedRef.current),onDestination:p=>{setDestination(p);if(!p)approachingTarget.current=null},onReady:s=>{space.current=s;setReady(true);updateSceneVisualState(h.scene,h.save.facts);s.pause(h.version===0)},onError:e=>{console.error(e);setError(String(e))}})}catch(e){console.error(e);setError('旅程未能载入 / The journey could not load.')}})();return()=>{alive=false}},[])
 useEffect(()=>{if(ready)updateSceneVisualState(scene,facts)},[ready,scene,facts])
 const entityDialog=Boolean(dialog&&dialog in entities)
 const selected=entityDialog?entities[dialog as EntityId]:null
 selectedRef.current=selected?.id??null;residentPaused.current=!ready||busy||Boolean(error)||Boolean(dialog)||openingOpen
 const sceneEntities=Object.values(entities).filter(e=>e.scene===scene&&(e.id!=='preview-screen'||facts.voiceRevisited))
 const chosen=focusId?entities[focusId]:null
 useEffect(()=>{
  const next=stableNearby(sceneEntities,position,e=>entityNear(e,position),focusId??undefined,preferredTarget.current??undefined)
  setFocusId(next?.id??null)
  if(preferredTarget.current&&!next)preferredTarget.current=null
 },[scene,position,facts.voiceRevisited])
 useEffect(()=>{preferredTarget.current=null},[scene])
 useEffect(()=>{
  const unlock=()=>startGameAudio(muted)
  window.addEventListener('pointerdown',unlock,{passive:true})
  window.addEventListener('keydown',unlock)
  return()=>{window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock)}
 },[muted])
 useEffect(()=>{space.current?.pause(!ready||Boolean(dialog)||busy||Boolean(error)||openingOpen);keys.current.clear()},[ready,dialog,busy,error,openingOpen])
 useEffect(()=>{let frame=0,last=0,lastPaint=0;const tick=(time:number)=>{const dt=last?Math.min(.04,(time-last)/1000):0;last=time;let changed=false;for(const id of personIds){const e=entities[id];if(e.scene!==sceneRef.current)continue;const motion=residents.current[id],before={...motion.state.position},beforeFacing=motion.state.facing,beforeFrame=motion.state.frame;const state=motion.update(dt,positionRef.current,residentPaused.current,selectedRef.current===id||approachingTarget.current===id,point=>residentWalkable(id,point,positionRef.current));placeResident(id,state);projectResident(id,state);if(before.x!==state.position.x||before.y!==state.position.y||beforeFacing!==state.facing||beforeFrame!==state.frame)changed=true}if(changed&&time-lastPaint>=64){lastPaint=time;residentRevision.current++;paintResidents(residentRevision.current)}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[])
 useEffect(()=>{const moveKeys=()=>space.current?.move((keys.current.has('arrowright')||keys.current.has('d')?1:0)-(keys.current.has('arrowleft')||keys.current.has('a')?1:0),(keys.current.has('arrowdown')||keys.current.has('s')?1:0)-(keys.current.has('arrowup')||keys.current.has('w')?1:0))
  const down=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('.mm-portrait-viewer')||(e.target as HTMLElement)?.matches('input,textarea,select')||busy||error||openingOpen)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){if(dialog&&!entityDialog)return;if(entityDialog){setDialog(null);setZoom(null);setConfirmation(null);resetConversation();space.current?.pause(false)}keys.current.add(k);moveKeys();e.preventDefault()}}
  const up=(e:KeyboardEvent)=>{keys.current.delete(e.key.toLowerCase());moveKeys()}
  const blur=()=>{keys.current.clear();space.current?.pause(true)}
  const focus=()=>{if(!document.hidden)space.current?.pause(Boolean(dialog)||busy||Boolean(error))}
  const visibility=()=>document.hidden?blur():focus()
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',visibility)
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',visibility)}
 },[dialog,entityDialog,busy,error,openingOpen])
 useEffect(()=>{const timer=setInterval(()=>{const h=current.current;if(h&&store.current&&space.current&&!busyRef.current)void store.current.checkpoint(h.scene,h.version,space.current.position()).catch(()=>{})},2000);return()=>clearInterval(timer)},[])
 useEffect(()=>{if(!message||dialog)return;const timer=setTimeout(()=>setMessage(''),6000);return()=>clearTimeout(timer)},[message,dialog])
 useEffect(()=>{const node=mapNode.current;if(!node)return;const update=()=>setMapView({width:node.clientWidth,height:node.clientHeight});const observer=new ResizeObserver(update);observer.observe(node);update();return()=>observer.disconnect()},[])
 const closeEntityInteraction=()=>{if(!entityDialog)return;setDialog(null);setZoom(null);setConfirmation(null);setMessage('');resetConversation();space.current?.pause(false)}
 const approach=(id:EntityId)=>{if(!head||busy||openingOpen||(dialog&&!entityDialog)||!ready)return;closeEntityInteraction();preferredTarget.current=id;approachingTarget.current=id;setMessage('');resetConversation();if(!space.current?.walkTo({...entities[id].approach},()=>{preferredTarget.current=id;setFocusId(id);playCue('approach',muted)})){approachingTarget.current=null;preferredTarget.current=null;setMessage(copy('现在走不到那里。','That route is blocked.'));playCue('blocked',muted)}}
 const toggleSound=()=>setMuted(old=>{const next=!old;try{window.alteruLocalStorage.setItem('memory-margin-muted',next?'1':'0')}catch{}setSoundMuted(next);if(!next)playCue('tap',false);return next})
 const restart=async()=>{if(!store.current||!space.current||busyRef.current)return;busyRef.current=true;setBusyKind('recovery');setBusy(true);try{const next=await store.current.restart(locale);journal.current?.clear();resetFootstepAudio();await space.current.restore(next.scene,next.position);setCurrent(next);positionRef.current=next.position;setPosition(next.position);setFocusId(null);setDialog(null);setZoom(null);setMessage('');resetConversation();setOpeningOpen(true)}finally{busyRef.current=false;setBusy(false);space.current?.pause(true)}}
 const entityLabel=(e:typeof entities[EntityId])=>e.id==='neighbor'&&facts.neighborMet?copy('玛拉 · 邻居','Mara · neighbor'):e.id==='caretaker'&&facts.caretakerMet?copy('伊莱亚斯 · 值守人','Elias · attendant'):e.id==='clerk'&&facts.clerkMet?copy('伊玛尼 · 窗口职员','Imani · clerk'):e.label[locale==='zh'?0:1]
 const talk=async(id:EntityId,label:string,authoredReply?:string,topicKey?:string)=>{
  const h=current.current;if(!h||chatRequest.current||!store.current)return
  const controller=new AbortController();chatRequest.current=controller
  const timer=setTimeout(()=>controller.abort(),25000),exchangeId=crypto.randomUUID()
  setComposerOpen(false);setChatError('');setMessage('');setConversationReply({player:label,speaker:conversationName(id,h.save),text:''});setConversationPage(0);setConversationGroup(null);setConversationPhase('waiting');playCue('tap',muted)
  try{
   const text=authoredReply??await requestDialogue(h,id,label,controller.signal)
   if(controller.signal.aborted||chatRequest.current!==controller||current.current?.version!==h.version)return
   const next=await store.current.appendConversationExchange(h.version,id,label,text,exchangeId,topicKey)
   if(chatRequest.current!==controller)return
   setCurrent(next);setConversationReply({player:label,speaker:conversationName(id,h.save),text});setConversationInput('');delete drafts.current[id]
  }catch(e){
   if(chatRequest.current!==controller)return
   setComposerOpen(true);setConversationReply(null);setConversationPhase('choices');setChatError(copy('暂时没能收到回应，你写的话还在，可以再试一次。','No reply arrived. Your message is still here; please try again.'))
  }finally{clearTimeout(timer);if(chatRequest.current===controller)chatRequest.current=null}
 }
 useEffect(()=>()=>{chatRequest.current?.abort()},[])
 useEffect(()=>{chatRequest.current?.abort();chatRequest.current=null;setConversationReply(null);setConversationPhase('choices');setChatError('');setComposerOpen(false);setConversationInput(dialog&&dialog in entities?drafts.current[dialog as EntityId]??'':'')},[dialog])

 const useNearby=()=>{
  if(openingOpen)return
  const intent=primaryInteractionIntent(chosen?.kind,Boolean(selected))
  if(intent==='close-panel'){closeEntityInteraction();return}
  if(intent==='inactive'||!chosen||busy||error)return
  if(intent==='enter-door'){const action=chosen.actions[0];if(action)act(chosen.id,action);return}
  setDialog(chosen.id);setConversationInput(drafts.current[chosen.id]??'');setZoom(null);setMessage('');setConfirmation(null);playCue('tap',muted)
 }
 useEffect(()=>{const down=(e:KeyboardEvent)=>{const target=e.target as HTMLElement|null;if(target?.matches('input,textarea,select,[contenteditable="true"]')||e.repeat||e.isComposing||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.key.toLowerCase()!=='e')return;e.preventDefault();useNearby()};window.addEventListener('keydown',down);return()=>window.removeEventListener('keydown',down)})
 const revisitText=selected?.id==='neighbor'&&facts.neighborDebriefed?copy(facts.previewTraced?'玛拉听完账户号，记下了 C-09。她仍愿意作证昨夜听到的六秒。':'玛拉知道预览已停。她仍愿意作证昨夜听到的六秒。',facts.previewTraced?'Mara wrote down C-09. She will still testify to the six seconds she heard.':'Mara knows playback has stopped. She will still testify to the six seconds she heard.'):selected?.id==='caretaker'&&facts.caretakerPreviewAsked?copy('伊莱亚斯只拦得住空白代签，拦不住窗口预览。他把投诉记录留给了你。','Elias could stop the blank signature, not the counter preview. He left you his complaint.'):selected?.id==='clerk'&&facts.clerkPreviewAsked?copy('伊玛尼承认：签名前，窗口已经让别人预览过你的私人声音。','Imani admitted the counter let someone preview your private voice before you signed.'):selected?panelDescription(selected.id,facts,locale):''
 const available=(id:EntityId)=>entities[id].actions.filter(a=>{
  const done:Record<string,string>={...Object.fromEntries(discoveries.map(d=>[d.action,d.fact])),'listen-voice':'voiceHeard','read-receipt':'receiptRead','read-breakfast':'breakfastRead','talk-neighbor':'neighborMet','talk-caretaker':'caretakerMet','read-seal':'sealRead','read-hall-notice':'hallNoticeRead','talk-clerk':'clerkMet','read-ledger':'ledgerRead','read-terms':'termsRead','compare-records':'compared','choose-keep':'kept','choose-lend':'lent','inspect-decision':'decisionSeen','revisit-voice':'voiceRevisited','try-save-morning':'morningHandled','save-morning':'morningHandled','ask-neighbor-preview':'neighborPreview','read-preview-log':'previewLogRead','confront-clerk-preview':'clerkPreviewAsked','ask-caretaker-preview':'caretakerPreviewAsked','stop-preview':'previewStopped','trace-preview':'previewTraced','debrief-neighbor':'neighborDebriefed'}
  if(id==='choice-desk'&&['compare-records','choose-keep','choose-lend'].includes(a))return false
  if(done[a]&&facts[done[a]])return false
  if(a==='revisit-voice'&&!facts.kept&&!facts.lent)return false
  if((a==='try-save-morning'||a==='save-morning')&&(!facts.voiceRevisited||(a==='try-save-morning'&&!facts.kept)||(a==='save-morning'&&!facts.lent)))return false
  if(a==='listen-voice'&&(facts.kept||facts.lent))return false
  if((a==='choose-keep'||a==='choose-lend')&&(!facts.compared||facts.kept||facts.lent))return false
  if(a==='inspect-decision'&&!facts.kept&&!facts.lent)return false
  if(a==='compare-records'&&!facts.receiptRead&&!facts.sealRead&&!facts.ledgerRead)return false
  if(a==='ask-neighbor-preview'&&(!facts.voiceRevisited||!facts.neighborMet))return false
  if(a==='read-preview-log'&&!facts.neighborPreview)return false
  if(a==='confront-clerk-preview'&&(!facts.previewLogRead||!facts.clerkMet))return false
  if(a==='ask-caretaker-preview'&&(!facts.previewLogRead||!facts.caretakerMet))return false
  if((a==='stop-preview'||a==='trace-preview')&&(!facts.previewLogRead||!facts.clerkPreviewAsked||facts.previewStopped||facts.previewTraced))return false
  if(a==='debrief-neighbor'&&(!facts.neighborPreview||(!facts.previewStopped&&!facts.previewTraced)))return false
  if(a==='stop-preview'||a==='trace-preview')return false
  return true
 })
 const docs=[
  ...(head?discoveryRecords(head.save):[]),
  {id:'receipt',title:copy('迁入回执','Arrival receipt'),source:copy('居所 · 桌上','Home · desk'),known:Boolean(facts.receiptRead),body:copy('转生完成。私人记忆 01：暂存。授权栏：空白。','Transfer complete. Personal memory 01: temporary hold. Authorization: blank.')},
  {id:'seal',title:copy('暂停封签','Suspension seal'),source:copy('公共走廊 · 墙面','Shared hall · wall'),known:Boolean(facts.sealRead),body:copy('23:16，自动借用口暂停。原因：授权栏空白，不能代签。','23:16, automatic lending suspended. Reason: blank authorization cannot be signed for another.')},
  {id:'ledger',title:copy('公开使用记录','Public use register'),source:copy('档案区 · 左侧档案架','Archive · left rack'),known:Boolean(facts.ledgerRead),body:copy('23:17，私人记忆 01 待借用。使用人未公开。签名后 30 天不可撤回。','23:17, personal memory 01 queued for lending. User undisclosed. Cannot revoke for 30 days after signing.')},
  {id:'breakfast',title:copy('早餐便条','Breakfast note'),source:copy('居所 · 杯下','Home · under cup'),known:Boolean(facts.breakfastRead),body:copy('面包已送到。黄油味是楼里共享的，闻不见就告诉等电梯的邻居。','Bread delivered. The smell of butter is shared by the building. Tell the neighbor by the lift if it does not arrive.')},
  {id:'hall-notice',title:copy('走廊告示','Hall notice'),source:copy('公共走廊 · 墙面','Shared hall · wall'),known:Boolean(facts.hallNoticeRead),body:copy('如果父亲只剩一个记忆位，今天存我的名字，明天存他的生日，哪一个应该被叫作原件？','If my father has one memory slot, should he keep my name today or his birthday tomorrow? Which one is the original?')},
  {id:'terms',title:copy('服务说明','Service terms'),source:copy('记忆服务点 · 窗口','Memory service · counter'),known:Boolean(facts.termsRead),body:copy('新转生者可长期保留一段私人记忆。临时缓存会清空；借出可腾出位置。','A new arrival may keep one private memory long term. Temporary holding is cleared; lending frees a slot.')},
  {id:'preview',title:copy('六秒播放记录','Six-second playback log'),source:copy('记忆服务点 · 窗口预览屏','Memory service · preview screen'),known:Boolean(facts.previewLogRead),body:copy('23:17，私人记忆 01 外放 6 秒；用途：借用人预览；授权：空白。收听账户：'+(facts.previewTraced?'C-09。':'遮蔽。'),'23:17, personal memory 01 played for six seconds. Purpose: borrower preview. Authorization: blank. Listener account: '+(facts.previewTraced?'C-09.':'masked.'))}
 ]
 const evidenceDocs=docs.filter(d=>['receipt','seal','ledger'].includes(d.id))
 const activeDoc=docs.find(d=>d.id===zoom&&d.known)
 const selectedDoc=selected?docs.find(d=>d.id===recordIdForEntity[selected.id]&&d.known):undefined
 const renderAction=(a:string)=>{const reason=head?actionBlockReason(head.save,a):'';return <div className="mm-action-entry" key={a}><button disabled={busy||Boolean(error)||Boolean(reason)} aria-describedby={reason?'blocked-'+a:undefined} onClick={()=>selected&&act(selected.id,a)}>{actionCopy[a][locale==='zh'?0:1]}<Icon name="arrow"/></button>{reason&&<p id={'blocked-'+a} className="mm-action-reason">{reason}</p>}</div>}
 const value=(e:typeof entities[EntityId])=>e.id==='preview-screen'?(facts.previewStopped?'preview-off':facts.previewTraced?'preview-traced':'preview-on'):e.kind==='person'?'person':e.kind==='door'?'door':e.kind==='memory'?(facts.kept?'memory-restored':facts.voiceHeard?'memory-gap':'memory'):(e.id==='choice-desk'&&facts.kept)?'decided':(e.id==='choice-desk'&&facts.lent)?'decided-lent':e.kind
 const panelTitle=dialog==='backpack'?copy('背包','Backpack'):dialog==='map'?copy('地图','Map'):dialog==='menu'?copy('菜单','Menu'):dialog==='result'?copy('第一日记录','Day one record'):''
 const topics=selected?.kind==='person'&&head?conversationTopics(selected.id,head.save,head.conversationHistory):[]
 const talkTopics=topics.filter(topic=>topic.id!=='share-findings'),shareTopics=topics.filter(topic=>topic.id==='share-findings')
 const conversationHistory=selected&&head?characterConversation(head.conversationHistory,selected.id,Number.MAX_SAFE_INTEGER):[]
 const visibleConversationHistory=conversationReply?.text?conversationHistory.slice(0,-2):conversationHistory
 const replyPages=conversationReply?conversationPages(conversationReply.text,locale):[],moreReplyPages=conversationPage<replyPages.length-1
 useEffect(()=>{if(!conversationReply?.text||conversationPhase!=='waiting')return;const timer=setTimeout(()=>setConversationPhase('reply'),520);return()=>clearTimeout(timer)},[conversationReply,conversationPhase])
 useEffect(()=>{if(!conversationReply||conversationPhase!=='reply'||moreReplyPages)return;const timer=setTimeout(()=>setConversationPhase('choices'),900);return()=>clearTimeout(timer)},[conversationReply,conversationPhase,conversationPage,moreReplyPages])
 useEffect(()=>{if(!conversationReply)return;document.querySelector<HTMLElement>('.mm-interaction-layer .mm-dialog-body')?.scrollTo({top:0})},[conversationReply,conversationPhase,conversationPage])
 return <main className="mm-app" data-release="memory-seven-places-20260926-r1" data-spatial-ui-theme="05-terminal"><header className="mm-header"><div><small>{sceneLabels[scene][locale==='zh'?0:1]}</small><h1>{copy('记忆余量','Memory Margin')}</h1></div><nav><button aria-label={copy('地图','Map')} disabled={openingOpen} onClick={()=>setDialog('map')}><Icon name="map"/><span>{copy('地图','Map')}</span></button><button aria-label={copy('背包','Backpack')} disabled={openingOpen} onClick={()=>{setBackpackTab('goal');setDialog('backpack')}}><Icon name="bag"/><span>{copy('背包','Bag')}</span></button><button aria-label={copy('菜单','Menu')} disabled={openingOpen} onClick={()=>setDialog('menu')}><Icon name="menu"/><span>{copy('菜单','Menu')}</span></button><button className="mm-sound" aria-label={muted?copy('开启声音','Turn sound on'):copy('静音','Mute sound')} aria-pressed={!muted} onClick={toggleSound}><Icon name={muted?'mute':'sound'}/></button></nav></header>
  {facts.neighborDebriefed&&explorationComplete(facts)?<button className="mm-objective mm-objective--complete" onClick={()=>setDialog('result')}><span>{copy('第一日','DAY ONE')}</span>{copy('本章探索完成 · 查看这一日的结果','Chapter explored · review this day')}<Icon name="arrow"/></button>:<button className="mm-objective mm-objective--route" disabled={openingOpen||!head} onClick={()=>setDialog('map')}><span>{chapterLabel(facts,locale)}</span>{head?objective(head.save):copy('正在醒来…','Waking…')}<Icon name="map"/></button>}
  <section className="mm-stage"><div ref={mapNode} className="mm-map" data-scene={scene} onClick={e=>{if((e.target as HTMLElement).closest('button')||openingOpen||(dialog&&!entityDialog)||busy||!ready)return;closeEntityInteraction();preferredTarget.current=null;const box=e.currentTarget.getBoundingClientRect(),camera=mapCamera(mapViewRef.current,positionRef.current);space.current?.walkTo({x:(e.clientX-box.left-camera.x)/camera.scale-4.5,y:(e.clientY-box.top-camera.y)/camera.scale-15})}}>
   <div ref={worldNode} className="mm-world" style={{transform:`translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.scale})`}}>
   <div id="rpg"/>
   {destination&&<span className="mm-destination" style={{left:(destination.x+4.5)/384*100+'%',top:(destination.y+15)/512*100+'%'}}/>}
   {sceneEntities.map(e=><button key={e.id} className={'mm-hotspot'+(focusId===e.id?' mm-hotspot--near':'')+(e.kind==='door'?' mm-hotspot--door':'')} style={{left:(e.visual.x+e.visual.w/2)/384*100+'%',top:(e.kind==='person'?e.visual.y+e.visual.h-actorCellWorld*actorFootFraction-8:e.visual.y+e.visual.h/2)/512*100+'%'}} aria-label={entityLabel(e)} data-entity={e.id} onClick={()=>approach(e.id)}><span>{entityLabel(e)}</span></button>)}
   </div>
   {(!ready||busy)&&<div className="mm-loading">{!ready?copy('正在唤回这段旅程…','Reopening this journey…'):busyKind==='transition'?copy('正在前往下一处…','Moving to the next place…'):busyKind==='recovery'?copy('正在恢复上一次进度…','Restoring your last place…'):copy('正在确认你的选择…','Confirming your choice…')}</div>}
  </div></section>
  <footer className="mm-controls"><Joystick label={copy('移动摇杆','Movement joystick')} move={(x,y)=>{if(openingOpen||busy||error||(dialog&&!entityDialog))return;if(entityDialog&&(x||y))closeEntityInteraction();space.current?.move(x,y)}}/><button className="mm-primary" data-actionable={Boolean(!openingOpen&&(selected||chosen)&&!busy&&!error)} disabled={openingOpen||(!selected&&!chosen)||busy||Boolean(error)} onPointerDown={e=>{e.preventDefault();useNearby()}}><span>{selected?entityLabel(selected):chosen?entityLabel(chosen):copy('附近没有物件','Nothing nearby')}</span><strong>{selected?copy('继续探索','Keep exploring'):chosen?interactionVerb(chosen.kind,locale):copy('走近后互动','Move closer to interact')}</strong><Icon name="arrow"/></button></footer>
  {message&&!dialog&&<p className="mm-toast" role="status">{message}</p>}
  {openingOpen&&ready&&head&&<div className="mm-opening-layer"><section className="mm-opening" role="dialog" aria-modal="true" aria-labelledby="mm-opening-title"><header><small>{copy('06:42 · 转生后的第一天','06:42 · FIRST DAY AFTER TRANSFER')}</small><h2 id="mm-opening-title">{copy('你在云端醒来','You wake in the cloud')}</h2></header><div className="mm-opening-story">{openingNarration(locale).map((line,index)=><p key={line}><span>{String(index+1).padStart(2,'0')}</span>{line}</p>)}</div><aside><strong>{copy('从这里开始','START HERE')}</strong><p>{copy('先走近桌上的语音盒，再按右下行动键。地图、背包和菜单会在开始后开放。','Approach the voice box on the table, then use the lower-right action. Map, Backpack and Menu open after you begin.')}</p></aside><button onClick={()=>{setOpeningOpen(false);startGameAudio(muted);playCue('tap',muted);space.current?.pause(false)}}>{copy('开始探索','Start exploring')}<Icon name="arrow"/></button></section></div>}
  {dialog&&<div className={selected?'mm-interaction-layer':'mm-scrim'}><section className="mm-dialog" data-kind={selected?.kind??dialog} role="dialog" aria-modal={selected?undefined:true} aria-label={selected?entityLabel(selected):panelTitle}><header>{selected?.kind==='person'&&<button className="mm-portrait mm-dialog-portrait" data-character={selected.id} style={{backgroundImage:`url('./art/rebuild-20260924/${selected.id}-portrait.png')`,backgroundSize:'cover',backgroundPosition:'center'}} aria-label={copy('放大人物头像','Enlarge character portrait')} onClick={()=>setZoom('portrait')}><Icon name="expand"/></button>}<div><small>{selected?sceneLabels[scene][locale==='zh'?0:1]:copy('旅程工具','JOURNEY TOOLS')}</small><h2>{selected?entityLabel(selected):panelTitle}</h2></div><button aria-label={copy('回到地图','Back to map')} disabled={busy} onClick={()=>{setDialog(null);setZoom(null);setConfirmation(null);setMessage('');resetConversation();space.current?.pause(false)}}><Icon name="close"/></button></header><div className="mm-dialog-body">
   {dialog==='map'&&head&&<MemoryMap busy={busy} onTravel={target=>{const h=current.current;if(!h||!space.current||busyRef.current)return;void apply({id:crypto.randomUUID(),version:h.version,scene:h.scene,entity:'home-door',action:'map-travel:'+target,position:space.current.position()})}} save={head.save} scene={scene} locale={locale}/>}
   {dialog==='backpack'&&head&&<MemoryBackpack save={head.save} records={docs} tab={backpackTab} setTab={setBackpackTab} onRead={setZoom}/>}
   {dialog==='menu'&&<MemoryMenu locale={locale} muted={muted} onToggleSound={toggleSound} onRestart={()=>void restart()}/>}
   {dialog==='result'&&<div className="mm-result" data-outcome={facts.previewTraced?'traced':'stopped'}><div className="mm-result-signal"><span>{copy('第一日记录已封存','DAY ONE RECORD SEALED')}</span><div aria-hidden="true"><i/><i/><i/><i/><i/><i/></div><strong>{facts.previewTraced?'C-09':copy('匿名','ANONYMOUS')}</strong></div><p className="mm-result-lead">{copy('转生后的第一天，你弄清了自己那段声音的去向，也发现制度在你签名前就让别人听过它。','On your first day after transfer, you found where your voice went—and learned that others heard it before you signed anything.')}</p><div className="mm-result-entries"><section><small>01 / {copy('留下','KEPT')}</small><p>{facts.kept?copy('昨夜的面馆约定已经取回，占用当前唯一的长期记忆位。','Last night’s noodle shop promise is back, occupying your only long-term slot.'):copy('昨夜的面馆约定借出 30 天；你暂时听不到结尾。','Last night’s promise is lent for 30 days; its ending remains out of reach.')}</p></section><section><small>02 / {copy('今早','THIS MORNING')}</small><p>{facts.morningStored?copy('你把早餐的气味和杯子的温度留进空位。','You kept the smell of breakfast and the warm cup in the freed slot.'):facts.morningHandled?copy('你尝试留下今早的印象，但它只能暂存到今天结束。','You tried to keep this morning, but it remains temporary until today ends.'):copy('语音盒里还有今早的短暂印象，尚未处理。','A brief impression of this morning remains in the voice box.')}</p></section><section><small>03 / {copy('六秒','SIX SECONDS')}</small><p>{facts.previewTraced?copy('你让私人声音再外放一次，取得收听账户 C-09，随后关掉预览。','You exposed the voice once more, found listener account C-09, then stopped previews.'):copy('你关掉了公开预览。23:17 的收听者仍未公开。','You stopped public previews. The 23:17 listener remains unnamed.')}</p></section></div><p className="mm-result-open">{facts.previewTraced?copy('C-09 是谁、为何在等这段声音，仍没有答案。','Who C-09 is, and why it waited for your voice, remain unanswered.'):copy('昨夜究竟是谁听过那六秒，仍没有答案。','Who heard those six seconds last night remains unanswered.')}</p><p className="mm-result-save">{copy('本章进度保存在当前浏览器。七处地点均可回访，后续章节尚未开放。','Your chapter progress is saved in this browser. You may revisit the seven locations. Further chapters are not open yet.')}</p></div>}
   {selected&&<>
    {selected.kind!=='person'&&<div className="mm-closeup" data-kind={value(selected)}>{selected.kind==='door'?<div className="mm-closeup-symbol"><Icon name="map"/></div>:<div className="mm-object-art" data-entity={selected.id} style={{backgroundImage:`url('${discoveryArt[selected.id]??'./art/objects.png'}')`,backgroundPosition:discoveryArt[selected.id]?'center':objectCell[selected.id],backgroundSize:discoveryArt[selected.id]?'contain':undefined,backgroundRepeat:'no-repeat'}} role="img" aria-label={selected.label[locale==='zh'?0:1]}/>} {selected.kind==='memory'&&facts.voiceHeard&&<div className="mm-wave"><i/><i/><i/><i/><i/><i className={facts.kept?'':'gap'}/><i className={facts.kept?'':'gap'}/></div>}</div>}
    {selected.id==='voice-box'&&facts.voiceRevisited&&<p className="mm-slot-status"><span>{copy('今早的印象','This morning')}</span><strong>{facts.morningStored?copy('已长期保留','KEPT'):facts.morningHandled?copy('仅暂存，将被清空','TEMPORARY ONLY'):copy('暂存中 · 待你决定','TEMPORARY · AWAITING YOU')}</strong></p>}
    {!(selected.kind==='person'&&conversationReply)&&<p className="mm-message" aria-live="polite">{message||(selected.id==='preview-screen'&&(facts.previewStopped||facts.previewTraced)?panelDescription(selected.id,facts,locale):selectedDoc?.body??revisitText)}</p>}
    {selected.kind==='person'&&conversationPhase==='choices'&&available(selected.id).length>0&&<div className="mm-actions">{available(selected.id).map(renderAction)}</div>}
    {selected.kind==='person'&&(selected.id==='neighbor'?facts.neighborMet:selected.id==='caretaker'?facts.caretakerMet:facts.clerkMet)&&<section className="mm-conversation" aria-label={copy('交谈','Conversation')} data-phase={conversationPhase} data-composing={composerOpen}>
     {conversationReply&&conversationPhase==='waiting'&&<div className="mm-conversation-turn mm-conversation-turn--player" aria-live="polite"><strong>{copy('你','You')}</strong><p>{conversationReply.player}</p><span className="mm-conversation-wait" role="status">{copy('等待回应','Waiting for a reply')}<i/><i/><i/></span></div>}
     {conversationReply&&conversationPhase!=='waiting'&&<div key={`${conversationReply.player}:${conversationPage}`} className="mm-conversation-turn mm-conversation-turn--npc" aria-live="polite"><strong>{conversationReply.speaker}</strong><p>{replyPages[conversationPage]}</p></div>}
     {conversationReply&&conversationPhase==='reply'&&moreReplyPages&&<button className="mm-conversation-continue" onClick={()=>setConversationPage(page=>page+1)}>{copy('继续','Continue')}<Icon name="arrow"/></button>}
     {conversationPhase==='choices'&&<div className="mm-conversation-options">
      {topics.length===0&&<p>{copy('暂时没有新的话题。你仍可以自由交谈或查看记录。','No new topics for now. You can still chat freely or review earlier conversations.')}</p>}<span className="mm-response-label">{conversationReply?copy('你的回应','YOUR RESPONSE'):copy('选择一句开场','CHOOSE A LINE')}</span>
      <div className="mm-conversation-topics">{talkTopics.slice(0,2).map(topic=><button key={topic.id} onClick={()=>talk(selected.id,topic.label,topic.reply,topic.key)}>{topic.label}</button>)}</div>
      {talkTopics.length>2&&<><button className="mm-conversation-disclosure" aria-expanded={conversationGroup==='more'} onClick={()=>setConversationGroup(group=>group==='more'?null:'more')}><span>{copy('其他话题','Other topics')}</span><Icon name="arrow"/></button>{conversationGroup==='more'&&<div className="mm-conversation-topics">{talkTopics.slice(2).map(topic=><button key={topic.id} onClick={()=>talk(selected.id,topic.label,topic.reply,topic.key)}>{topic.label}</button>)}</div>}</>}
      {shareTopics.length>0&&<><button className="mm-conversation-disclosure" aria-expanded={conversationGroup==='share'} onClick={()=>setConversationGroup(group=>group==='share'?null:'share')}><span>{copy('分享发现','Share a discovery')}</span><Icon name="arrow"/></button>{conversationGroup==='share'&&<div className="mm-conversation-topics">{shareTopics.map(topic=><button key={topic.id} onClick={()=>talk(selected.id,topic.label,topic.reply,topic.key)}>{topic.label}</button>)}</div>}</>}
      {chatError&&<p className="mm-chat-error" role="alert">{chatError}</p>}<details className="mm-conversation-more" open={composerOpen}><summary onClick={event=>{event.preventDefault();setComposerOpen(open=>!open)}}>{copy('聊点别的…','Say something else…')}</summary><form onSubmit={event=>{event.preventDefault();const value=conversationInput.trim();if(value&&!composing.current)void talk(selected.id,value)}}><input aria-label={copy('交谈内容','Message')} value={conversationInput} maxLength={500} onCompositionStart={()=>{composing.current=true}} onCompositionEnd={()=>{composing.current=false}} onKeyDown={event=>{if(event.key==='Enter'&&(event.nativeEvent.isComposing||composing.current))event.preventDefault()}} onChange={event=>{setConversationInput(event.target.value);drafts.current[selected.id]=event.target.value}} placeholder={copy('想聊些什么？','What would you like to say?')}/><button disabled={!conversationInput.trim()}>{copy('交谈','Talk')}</button></form></details>
     </div>}
     {visibleConversationHistory.length>0&&<details className="mm-conversation-history"><summary>{copy('最近交谈','Recent conversation')}<span>{visibleConversationHistory.length}</span></summary><div>{visibleConversationHistory.slice(-historyLimit).map(turn=><p key={turn.id} data-speaker={turn.speaker}><strong>{turn.speaker==='player'?copy('你','You'):conversationName(selected.id,head!.save)}</strong>{turn.text}</p>)}</div>{visibleConversationHistory.length>historyLimit&&<button onClick={()=>setHistoryLimit(n=>n+8)}>{copy('查看更多记录','Show earlier conversations')}</button>}</details>}
    </section>}
    {selected.id==='choice-desk'&&!facts.compared&&<section className="mm-investigation"><h3>{copy('你觉得缺口来自哪里？','What caused the gap?')}</h3><div className="mm-hypotheses"><button data-selected={hypothesis==='transfer-error'} onClick={()=>setHypothesis('transfer-error')}>{copy('转生时自然损坏','Transfer damage')}</button><button data-selected={hypothesis==='queued-lending'} onClick={()=>setHypothesis('queued-lending')}>{copy('被放进待借用区','Queued for lending')}</button></div>{hypothesis&&<><div className="mm-source-compare">{evidenceDocs.map(d=><div key={d.id}><strong>{d.title}</strong><span>{d.known?d.body:copy('尚未读取','Not read yet')}</span></div>)}</div>{evidenceDocs.every(d=>d.known)&&facts.clerkMet?<button className="mm-compare-submit" onClick={()=>hypothesis==='queued-lending'?act(selected.id,'compare-records'):setMessage(copy('三处记录都指向借用流程；转生时自然损坏解释不了 23:16 的封口。你可以改选。','All three records point to lending. Transfer damage cannot explain the 23:16 seal. Choose again.'))}>{copy('确认核对','Confirm comparison')}<Icon name="arrow"/></button>:<p className="mm-done">{copy('先读完回执、封签、公开记录，并询问窗口职员。','Read all three records and speak to the clerk first.')}</p>}</>}</section>}
    {selected.id==='choice-desk'&&facts.compared&&!facts.kept&&!facts.lent&&<><aside className="mm-terms"><strong>{copy('签名前先看清','READ BEFORE SIGNING')}</strong><p>{copy('保留：取回结尾，当前唯一长期记忆位被占满。','Keep: recover the ending; your only long-term slot is filled.')}</p><p>{copy('借出：空出这一格，30 天内无法取回结尾。','Lend: free that slot; the ending cannot be recalled for 30 days.')}</p></aside><div className="mm-actions"><button onClick={()=>setConfirmation('choose-keep')}>{actionCopy['choose-keep'][locale==='zh'?0:1]}<Icon name="arrow"/></button><button onClick={()=>setConfirmation('choose-lend')}>{actionCopy['choose-lend'][locale==='zh'?0:1]}<Icon name="arrow"/></button></div>{confirmation&&<div className="mm-confirm"><p>{confirmation==='choose-keep'?copy('确认取回结尾，并占用唯一的长期记忆位？','Recover the ending and fill your only long-term slot?'):copy('确认借出 30 天，期间无法取回结尾？','Lend for 30 days, unable to recall the ending during that time?')}</p><button disabled={busy} onClick={()=>{act(selected.id,confirmation);setConfirmation(null)}}>{copy('确认这个选择','Confirm this choice')}</button><button onClick={()=>setConfirmation(null)}>{copy('再想想','Think again')}</button></div>}</>}
    {selected.id==='preview-screen'&&facts.previewLogRead&&facts.clerkPreviewAsked&&!facts.previewStopped&&!facts.previewTraced&&<><aside className="mm-terms"><strong>{copy('决定谁能再听见','WHO HEARS THE NEXT SIX SECONDS')}</strong><p>{copy('立即关闭：不再外放；已有收听者仍匿名。','Stop now: no more playback; the past listener stays anonymous.')}</p><p>{copy('再播一次：得到正在收听的账户号；你的私人声音会再外放 6 秒，然后关闭。','Play once: reveal the current listener account; your private voice plays for six more seconds, then stops.')}</p></aside><div className="mm-actions"><button onClick={()=>setConfirmation('stop-preview')}>{actionCopy['stop-preview'][locale==='zh'?0:1]}<Icon name="arrow"/></button><button onClick={()=>setConfirmation('trace-preview')}>{actionCopy['trace-preview'][locale==='zh'?0:1]}<Icon name="arrow"/></button></div>{(confirmation==='stop-preview'||confirmation==='trace-preview')&&<div className="mm-confirm"><p>{confirmation==='stop-preview'?copy('确认关闭预览，保留匿名记录？','Stop playback and keep the anonymous log?'):copy('确认让私人声音再外放 6 秒，以取得账户号？','Let the private voice play for six more seconds to get the account number?')}</p><button disabled={busy} onClick={()=>{act(selected.id,confirmation);setConfirmation(null)}}>{copy('确认这个选择','Confirm this choice')}</button><button onClick={()=>setConfirmation(null)}>{copy('再想想','Think again')}</button></div>}</>}
    {selected.kind!=='person'&&<div className="mm-actions">{available(selected.id).map(renderAction)}</div>}
    {selectedDoc&&<button className="mm-read-more" disabled={busy} onClick={()=>setZoom(selectedDoc.id)}>{copy('放大查看','Enlarge record')} <Icon name="expand"/></button>}

   </>}
  </div>{dialog==='result'&&<footer className="mm-result-footer"><button onClick={()=>setDialog(null)}>{copy('回到街区','Return to the block')}<Icon name="arrow"/></button></footer>}{activeDoc&&<div className="mm-zoom" role="dialog" aria-label={activeDoc.title}><button className="mm-zoom-close" onClick={()=>setZoom(null)} aria-label={copy('关闭放大资料','Close enlarged record')}><Icon name="close"/></button><small>{activeDoc.source}</small><h3>{activeDoc.title}</h3><p>{activeDoc.body}</p><span>{copy('仅供阅读 · 返回后保留当前进度','READ ONLY · YOUR PLACE IS SAVED')}</span></div>}</section></div>}
  {zoom==='portrait'&&selected?.kind==='person'&&<PortraitViewer id={selected.id} name={entityLabel(selected)} closeLabel={copy('关闭人物大图','Close character portrait')} onClose={()=>setZoom(null)}/>}
  {error&&<aside className="mm-error" role="alert"><p>{error}</p><button onClick={()=>void retry()}>{copy('重试','Retry')}</button></aside>}
 </main>
}
const query=new URLSearchParams(location.search)
createRoot(document.getElementById('root')!).render(query.get('generated_room')==='1'?<GeneratedRoomReview/>:query.get('large_scene')==='1'?<LargeSceneReview/>:<App/>)
