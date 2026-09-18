import './game-id'
import React,{useEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {JourneyStore} from './storage'
import {PendingJourney,performPending,recoverPending} from './pending-journey'
import {type Head,type Action} from './journey'
import {entities,world,sceneLabels,type EntityId,type Scene} from './world'
import {backgrounds,heroSheet} from './art'
import {t,objective,type Locale} from './story'
import type {Space} from './spatial/rpg-space'
import type {Point} from './spatial/world'
import './style.css'

const initialLocale:Locale=(new URLSearchParams(location.search).get('lang')??navigator.language).toLowerCase().startsWith('en')?'en':'zh'
type Dialog=EntityId|'records'|'people'|'places'|null
const actionCopy:Record<string,[string,string]>={
 'listen-voice':['播放这段语音','Play the voice'], 'revisit-voice':['再听一次','Play it again'], 'read-receipt':['读回执','Read receipt'],
 'to-hall':['走进走廊','Enter the hall'],'to-home':['回居所','Return home'],'talk-neighbor':['跟她说话','Talk to her'],'talk-caretaker':['问值守人','Ask the attendant'],'read-seal':['查看封签','Read the seal'],
 'to-service':['进入服务点','Enter memory service'],'service-to-hall':['回走廊','Return to the hall'],'talk-clerk':['问窗口职员','Ask the clerk'],'read-ledger':['读公开记录','Read the register'],
 'compare-records':['核对三处记录','Compare three sources'],'choose-keep':['撤下借用，取回结尾','Withdraw lending, recover ending'],'choose-lend':['借出 30 天，保留空位','Lend for 30 days, free a slot'],'inspect-decision':['查看处理结果','Read the decision']
 ,'read-breakfast':['读早餐便条','Read breakfast note'],'read-hall-notice':['看看走廊告示','Read hall notice'],'read-terms':['读服务说明','Read service terms'],
 'ask-neighbor-preview':['问她听见的声音','Ask about the voice'],'read-preview-log':['查看播放记录','Read playback log'],'confront-clerk-preview':['问她为何外放','Ask about playback'],'ask-caretaker-preview':['问封签为何没拦住','Ask about the seal'],'stop-preview':['关闭公开预览','Stop public previews'],'trace-preview':['再播一次，追查账户','Play once more, trace account'],'debrief-neighbor':['告诉她窗口的结果','Tell her what happened']
}
function Icon({name}:{name:'record'|'people'|'map'|'close'|'arrow'|'move'|'expand'}){
 const paths={record:'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',people:'M16 20v-2a4 4 0 0 0-8 0v2M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',close:'M5 5l14 14M19 5 5 19',arrow:'M4 12h15m-6-6 6 6-6 6',move:'M12 3v18M3 12h18m-12-6 3-3 3 3m-9 3-3 3 3 3m3 3 3 3-3 3',expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'}
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true"><path d={paths[name]}/></svg>
}
function Joystick({move,label}:{move:(x:number,y:number)=>void;label:string}){
 const [knob,setKnob]=useState({x:0,y:0}),active=useRef<number|null>(null)
 const update=(e:React.PointerEvent<HTMLDivElement>)=>{const box=e.currentTarget.getBoundingClientRect(),x=(e.clientX-box.left-box.width/2)/24,y=(e.clientY-box.top-box.height/2)/24,len=Math.max(1,Math.hypot(x,y));setKnob({x:x/len*15,y:y/len*15});move(x/len,y/len)}
 const stop=()=>{active.current=null;setKnob({x:0,y:0});move(0,0)}
 return <div role="group" aria-label={label} className="mm-stick" onPointerDown={e=>{active.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e)}} onPointerMove={e=>{if(active.current===e.pointerId)update(e)}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><span style={{transform:`translate(${knob.x}px,${knob.y}px)`}}><Icon name="move"/></span></div>
}

function App(){
 const [head,setHead]=useState<Head|null>(null),[position,setPosition]=useState<Point>(world.scenes.home.spawn),[destination,setDestination]=useState<Point|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[dialog,setDialog]=useState<Dialog>(null),[zoom,setZoom]=useState<string|null>(null),[message,setMessage]=useState(''),[error,setError]=useState(''),[hypothesis,setHypothesis]=useState<'transfer-error'|'queued-lending'|null>(null),[confirmation,setConfirmation]=useState<'choose-keep'|'choose-lend'|'stop-preview'|'trace-preview'|null>(null)
 const current=useRef<Head|null>(null),store=useRef<JourneyStore|null>(null),journal=useRef<PendingJourney|null>(null),space=useRef<Space|null>(null),busyRef=useRef(false),keys=useRef(new Set<string>())
 const locale=head?.save.locale??initialLocale,copy=(zh:string,en:string)=>t(locale,zh,en),scene:Scene=head?.scene??'home',facts=head?.save.facts??{}
 const setCurrent=(h:Head)=>{current.current=h;setHead(h)}
 const apply=async(request:Action)=>{
  if(busyRef.current||!store.current||!journal.current||!space.current)return
  busyRef.current=true;setBusy(true);space.current.pause(true);setError('')
  try{await performPending(store.current,journal.current,request,locale,async result=>{if(result.reconciled||space.current!.scene()!==result.head.scene)await space.current!.restore(result.head.scene,result.head.position);setCurrent(result.head);setMessage(result.text);if(result.reconciled||result.head.scene!==request.scene){setDialog(null);setZoom(null)}})}
  catch(e){console.error(e);setError(copy('操作尚未确认。重试会恢复同一次操作。','Action not confirmed. Retry restores the same operation.'))}
  finally{busyRef.current=false;setBusy(false)}
 }
 const retry=async()=>{if(!store.current||!journal.current||!space.current){location.reload();return}if(busyRef.current)return;busyRef.current=true;setBusy(true);try{const h=await recoverPending(store.current,journal.current,locale,async r=>{await space.current!.restore(r.head.scene,r.head.position);setCurrent(r.head);setMessage(r.text)});await space.current.restore(h.scene,h.position);setCurrent(h);setDialog(null);setZoom(null);setError('')}catch(e){console.error(e);setError(copy('暂时不能读取旅程。存储恢复后请重试。','Journey storage is unavailable. Retry when storage recovers.'))}finally{busyRef.current=false;setBusy(false)}}
 const act=(entity:EntityId,action:string)=>{const h=current.current;if(!h||!space.current)return;void apply({id:crypto.randomUUID(),version:h.version,scene:h.scene,entity,action,position:space.current.position()})}
 useEffect(()=>{let alive=true;void(async()=>{try{store.current=await JourneyStore.open();journal.current=new PendingJourney(window.alteruLocalStorage);const h=await recoverPending(store.current,journal.current,initialLocale);if(!alive)return;setCurrent(h);setPosition(h.position);const {createRpgSpace}=await import('./spatial/rpg-space');space.current=createRpgSpace({world,host:document.getElementById('rpg')!,scene:h.scene,position:h.position,speed:92,stride:28,poses:['step-left','step-center','step-right','step-center'],sheet:heroSheet,onPosition:p=>setPosition({...p}),onDestination:setDestination,onReady:s=>{space.current=s;setReady(true);s.pause(false)},onError:e=>{console.error(e);setError(String(e))}})}catch(e){console.error(e);setError('旅程未能载入 / The journey could not load.')}})();return()=>{alive=false}},[])
 useEffect(()=>{space.current?.pause(!ready||Boolean(dialog)||busy||Boolean(error));keys.current.clear()},[ready,dialog,busy,error])
 useEffect(()=>{const moveKeys=()=>space.current?.move((keys.current.has('arrowright')||keys.current.has('d')?1:0)-(keys.current.has('arrowleft')||keys.current.has('a')?1:0),(keys.current.has('arrowdown')||keys.current.has('s')?1:0)-(keys.current.has('arrowup')||keys.current.has('w')?1:0))
  const down=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches('input,textarea,select')||dialog||busy||error)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){keys.current.add(k);moveKeys();e.preventDefault()}}
  const up=(e:KeyboardEvent)=>{keys.current.delete(e.key.toLowerCase());moveKeys()}
  const blur=()=>{keys.current.clear();space.current?.pause(true)}
  const focus=()=>{if(!document.hidden)space.current?.pause(Boolean(dialog)||busy||Boolean(error))}
  const visibility=()=>document.hidden?blur():focus()
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',visibility)
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',visibility)}
 },[dialog,busy,error])
 useEffect(()=>{const timer=setInterval(()=>{const h=current.current;if(h&&store.current&&space.current&&!busyRef.current)void store.current.checkpoint(h.scene,h.version,space.current.position()).catch(()=>{})},2000);return()=>clearInterval(timer)},[])
 useEffect(()=>{if(!message||dialog)return;const timer=setTimeout(()=>setMessage(''),6000);return()=>clearTimeout(timer)},[message,dialog])
 const approach=(id:EntityId)=>{if(!head||busy||dialog||!ready)return;setMessage('');if(!space.current?.walkTo(entities[id].approach,()=>{setDialog(id);setZoom(null)}))setMessage(copy('现在走不到那里。','That route is blocked.'))}
 const selected=dialog&&dialog in entities?entities[dialog as EntityId]:null
 const available=(id:EntityId)=>entities[id].actions.filter(a=>{
  const done:Record<string,string>={'listen-voice':'voiceHeard','read-receipt':'receiptRead','read-breakfast':'breakfastRead','talk-neighbor':'neighborMet','talk-caretaker':'caretakerMet','read-seal':'sealRead','read-hall-notice':'hallNoticeRead','talk-clerk':'clerkMet','read-ledger':'ledgerRead','read-terms':'termsRead','compare-records':'compared','choose-keep':'kept','choose-lend':'lent','inspect-decision':'decisionSeen','revisit-voice':'voiceRevisited','ask-neighbor-preview':'neighborPreview','read-preview-log':'previewLogRead','confront-clerk-preview':'clerkPreviewAsked','ask-caretaker-preview':'caretakerPreviewAsked','stop-preview':'previewStopped','trace-preview':'previewTraced','debrief-neighbor':'neighborDebriefed'}
  if(id==='choice-desk'&&['compare-records','choose-keep','choose-lend'].includes(a))return false
  if(done[a]&&facts[done[a]])return false
  if(a==='revisit-voice'&&!facts.kept&&!facts.lent)return false
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
  {id:'receipt',title:copy('迁入回执','Arrival receipt'),source:copy('居所 · 桌上','Home · desk'),known:Boolean(facts.receiptRead),body:copy('转生完成。私人记忆 01：暂存。授权栏：空白。','Transfer complete. Personal memory 01: temporary hold. Authorization: blank.')},
  {id:'seal',title:copy('暂停封签','Suspension seal'),source:copy('公共走廊 · 墙面','Shared hall · wall'),known:Boolean(facts.sealRead),body:copy('23:16，自动借用口暂停。原因：授权栏空白，不能代签。','23:16, automatic lending suspended. Reason: blank authorization cannot be signed for another.')},
  {id:'ledger',title:copy('公开使用记录','Public use register'),source:copy('记忆服务点 · 档案架','Memory service · rack'),known:Boolean(facts.ledgerRead),body:copy('23:17，私人记忆 01 待借用。使用人未公开。签名后 30 天不可撤回。','23:17, personal memory 01 queued for lending. User undisclosed. Cannot revoke for 30 days after signing.')},
  {id:'breakfast',title:copy('早餐便条','Breakfast note'),source:copy('居所 · 杯下','Home · under cup'),known:Boolean(facts.breakfastRead),body:copy('面包已送到。黄油味是楼里共享的，闻不见就告诉等电梯的邻居。','Bread delivered. The smell of butter is shared by the building. Tell the neighbor by the lift if it does not arrive.')},
  {id:'hall-notice',title:copy('走廊告示','Hall notice'),source:copy('公共走廊 · 墙面','Shared hall · wall'),known:Boolean(facts.hallNoticeRead),body:copy('如果父亲只剩一个记忆位，今天存我的名字，明天存他的生日，哪一个应该被叫作原件？','If my father has one memory slot, should he keep my name today or his birthday tomorrow? Which one is the original?')},
  {id:'terms',title:copy('服务说明','Service terms'),source:copy('记忆服务点 · 窗口','Memory service · counter'),known:Boolean(facts.termsRead),body:copy('新转生者可长期保留一段私人记忆。临时缓存会清空；借出可腾出位置。','A new arrival may keep one private memory long term. Temporary holding is cleared; lending frees a slot.')},
  {id:'preview',title:copy('六秒播放记录','Six-second playback log'),source:copy('记忆服务点 · 窗口预览屏','Memory service · preview screen'),known:Boolean(facts.previewLogRead),body:copy('23:17，私人记忆 01 外放 6 秒；用途：借用人预览；授权：空白。收听账户：遮蔽。','23:17, personal memory 01 played for six seconds. Purpose: borrower preview. Authorization: blank. Listener account: masked.')}
 ]
 const evidenceDocs=docs.filter(d=>['receipt','seal','ledger'].includes(d.id))
 const activeDoc=docs.find(d=>d.id===zoom)
 const value=(e:typeof entities[EntityId])=>e.id==='preview-screen'?(facts.previewStopped?'preview-off':facts.previewTraced?'preview-traced':'preview-on'):e.kind==='person'?'person':e.kind==='door'?'door':e.kind==='memory'?(facts.kept?'memory-restored':facts.voiceHeard?'memory-gap':'memory'):(e.id==='choice-desk'&&facts.kept)?'decided':(e.id==='choice-desk'&&facts.lent)?'decided-lent':e.kind
 return <main className="mm-app" data-release="memory-margin-trial-20260918"><header className="mm-header"><div><small>{sceneLabels[scene][locale==='zh'?0:1]}</small><h1>{copy('记忆余量','Memory Margin')}</h1></div><nav><button aria-label={copy('档案','Records')} onClick={()=>setDialog('records')}><Icon name="record"/></button><button aria-label={copy('已见的人','People met')} onClick={()=>setDialog('people')}><Icon name="people"/></button><button aria-label={copy('地点','Places')} onClick={()=>setDialog('places')}><Icon name="map"/></button></nav></header>
  <p className="mm-objective"><span>{copy('眼前的事','NOW')}</span>{head?objective(head.save):copy('正在醒来…','Waking…')}</p>
  <section className="mm-stage"><div className="mm-map" data-scene={scene} onClick={e=>{if((e.target as HTMLElement).closest('button')||dialog||busy||!ready)return;const box=e.currentTarget.getBoundingClientRect();space.current?.walkTo({x:(e.clientX-box.left)/box.width*384-4.5,y:(e.clientY-box.top)/box.height*512-15})}}>
   <img className="mm-background" src={backgrounds[scene]} draggable={false}/>
   {Object.values(entities).filter(e=>e.scene===scene&&e.kind!=='door'&&(e.id!=='preview-screen'||facts.voiceRevisited)).map(e=><div key={e.id} className="mm-prop" data-kind={value(e)} style={{left:e.visual.x/384*100+'%',top:e.visual.y/512*100+'%',width:e.visual.w/384*100+'%',height:e.visual.h/512*100+'%'}}><span/></div>)}
   <div id="rpg"/>
   {destination&&<span className="mm-destination" style={{left:(destination.x+4.5)/384*100+'%',top:(destination.y+15)/512*100+'%'}}/>}
   {Object.values(entities).filter(e=>e.scene===scene&&(e.id!=='preview-screen'||facts.voiceRevisited)).map(e=><button key={e.id} className={'mm-hotspot'+(Math.hypot(position.x-e.approach.x,position.y-e.approach.y)<33?' mm-hotspot--near':'')} style={{left:(e.visual.x+e.visual.w/2)/384*100+'%',top:(e.visual.y+e.visual.h/2)/512*100+'%'}} aria-label={e.label[locale==='zh'?0:1]} data-entity={e.id} onClick={()=>approach(e.id)}><span>{e.label[locale==='zh'?0:1]}</span></button>)}
   {(!ready||busy)&&<div className="mm-loading">{copy('正在进入记忆…','Entering memory…')}</div>}
  </div></section>
  <footer className="mm-controls"><Joystick label={copy('移动摇杆','Movement joystick')} move={(x,y)=>{if(!dialog&&!busy&&!error)space.current?.move(x,y)}}/><span>{copy('点地面行走 · 点物件接近','Tap ground to walk · Tap an object to approach')}</span></footer>
  {message&&!dialog&&<p className="mm-toast" role="status">{message}</p>}
  {dialog&&<div className="mm-scrim"><section className="mm-dialog" role="dialog" aria-modal="true" aria-label={selected?selected.label[locale==='zh'?0:1]:copy(dialog==='records'?'档案':dialog==='people'?'已见的人':'地点',dialog==='records'?'Records':dialog==='people'?'People met':'Places')}><header><div><small>{selected?sceneLabels[scene][locale==='zh'?0:1]:copy('随身索引','PERSONAL INDEX')}</small><h2>{selected?selected.label[locale==='zh'?0:1]:copy(dialog==='records'?'档案':dialog==='people'?'已见的人':'地点',dialog==='records'?'Records':dialog==='people'?'People met':'Places')}</h2></div><button aria-label={copy('回到地图','Back to map')} disabled={busy} onClick={()=>{setDialog(null);setZoom(null);setConfirmation(null);setMessage('')}}><Icon name="close"/></button></header><div className="mm-dialog-body">
   {dialog==='records'&&<div className="mm-records">{docs.filter(d=>d.known).length?docs.filter(d=>d.known).map(d=><button key={d.id} onClick={()=>setZoom(d.id)}><span><strong>{d.title}</strong><small>{d.source}</small></span><Icon name="expand"/></button>):<p>{copy('还没有读过的资料。先看看桌上的语音盒。','No records read yet. Start with the voice box.')}</p>}</div>}
   {dialog==='people'&&<div className="mm-list">{facts.neighborMet&&<p><strong>{copy('安禾 · 邻居','Anhe · neighbor')}</strong><span>{facts.neighborPreview?copy('她承认无意听过窗口外放的私人声音，带你去查记录。','She admitted hearing the private voice at the counter and pointed you to the log.'):copy('她说过封签的事，也给了你一只面包。','She told you about the seal and gave you bread.')}</span></p>}{facts.caretakerMet&&<p><strong>{copy('骆叔 · 值守人','Luo · attendant')}</strong><span>{facts.caretakerPreviewAsked?copy('拦住了空白代签，也曾投诉六秒预览；他的权限到此为止。','He stopped a blank signature and complained about the preview; his authority ends there.'):copy('说话难听，却拦住了空白授权的自动代签。','Rough words, but stopped a signature without consent.')}</span></p>}{facts.clerkMet&&<p><strong>{copy('乔弥 · 窗口职员','Qiaomi · clerk')}</strong><span>{facts.clerkPreviewAsked?copy('她承认授权空白时声音已外放，却仍称这只是方便的预览。','She admits the voice played without authorization but calls it a helpful preview.'):copy('她说可以帮你“保住”记忆。','She offered to “protect” your memory.')}</span></p>}{!facts.neighborMet&&!facts.caretakerMet&&!facts.clerkMet&&<p>{copy('还没有认识这里的人。','You have not met anyone here yet.')}</p>}</div>}
   {dialog==='places'&&<div className="mm-list">{head?.save.map.filter(n=>n.visited).map(n=><p key={n.id}><strong>{n.label}</strong><span>{n.current?copy('现在所在','Current location'):copy('已到过','Visited')}</span></p>)}</div>}
   {selected&&<>
    <div className="mm-closeup" data-kind={value(selected)}><div className="mm-closeup-symbol">{selected.kind==='person'?(selected.id==='neighbor'&&facts.neighborMet?'安':selected.id==='caretaker'&&facts.caretakerMet?'骆':selected.id==='clerk'&&facts.clerkMet?'乔':<Icon name="people"/>):<Icon name={selected.kind==='door'?'map':'record'}/>}</div>{selected.kind==='memory'&&facts.voiceHeard&&<div className="mm-wave"><i/><i/><i/><i/><i/><i className={facts.kept?'':'gap'}/><i className={facts.kept?'':'gap'}/></div>}</div>
    <p className="mm-message" aria-live="polite">{message||(selected.id==='preview-screen'?(facts.previewStopped?copy('预览已关闭。23:17 的匿名记录还在。','Preview stopped. The anonymous 23:17 log remains.'):facts.previewTraced?copy('预览已关闭。收听账户 C-09 已记下。','Preview stopped. Listener account C-09 is recorded.'):facts.previewLogRead?copy('记录显示：授权空白时，私人声音已外放六秒。','The log shows six seconds played without authorization.'):copy('屏幕还亮着。','The screen is still on.')):copy('走近之后，你可以查看或交谈。','You are close enough to inspect or speak.'))}</p>
    {selected.id==='choice-desk'&&!facts.compared&&<section className="mm-investigation"><h3>{copy('你觉得缺口来自哪里？','What caused the gap?')}</h3><div className="mm-hypotheses"><button data-selected={hypothesis==='transfer-error'} onClick={()=>setHypothesis('transfer-error')}>{copy('转生时自然损坏','Transfer damage')}</button><button data-selected={hypothesis==='queued-lending'} onClick={()=>setHypothesis('queued-lending')}>{copy('被放进待借用区','Queued for lending')}</button></div>{hypothesis&&<><div className="mm-source-compare">{evidenceDocs.map(d=><div key={d.id}><strong>{d.title}</strong><span>{d.known?d.body:copy('尚未读取','Not read yet')}</span></div>)}</div>{evidenceDocs.every(d=>d.known)&&facts.clerkMet?<button className="mm-compare-submit" onClick={()=>hypothesis==='queued-lending'?act(selected.id,'compare-records'):setMessage(copy('三处记录都指向借用流程；转生时自然损坏解释不了 23:16 的封口。你可以改选。','All three records point to lending. Transfer damage cannot explain the 23:16 seal. Choose again.'))}>{copy('确认核对','Confirm comparison')}<Icon name="arrow"/></button>:<p className="mm-done">{copy('先读完回执、封签、公开记录，并询问窗口职员。','Read all three records and speak to the clerk first.')}</p>}</>}</section>}
    {selected.id==='choice-desk'&&facts.compared&&!facts.kept&&!facts.lent&&<><aside className="mm-terms"><strong>{copy('签名前先看清','READ BEFORE SIGNING')}</strong><p>{copy('保留：取回结尾，当前唯一长期记忆位被占满。','Keep: recover the ending; your only long-term slot is filled.')}</p><p>{copy('借出：空出这一格，30 天内无法取回结尾。','Lend: free that slot; the ending cannot be recalled for 30 days.')}</p></aside><div className="mm-actions"><button onClick={()=>setConfirmation('choose-keep')}>{actionCopy['choose-keep'][locale==='zh'?0:1]}<Icon name="arrow"/></button><button onClick={()=>setConfirmation('choose-lend')}>{actionCopy['choose-lend'][locale==='zh'?0:1]}<Icon name="arrow"/></button></div>{confirmation&&<div className="mm-confirm"><p>{confirmation==='choose-keep'?copy('确认取回结尾，并占用唯一的长期记忆位？','Recover the ending and fill your only long-term slot?'):copy('确认借出 30 天，期间无法取回结尾？','Lend for 30 days, unable to recall the ending during that time?')}</p><button disabled={busy} onClick={()=>{act(selected.id,confirmation);setConfirmation(null)}}>{copy('确认这个选择','Confirm this choice')}</button><button onClick={()=>setConfirmation(null)}>{copy('再想想','Think again')}</button></div>}</>}
    {selected.id==='preview-screen'&&facts.previewLogRead&&facts.clerkPreviewAsked&&!facts.previewStopped&&!facts.previewTraced&&<><aside className="mm-terms"><strong>{copy('决定谁能再听见','WHO HEARS THE NEXT SIX SECONDS')}</strong><p>{copy('立即关闭：不再外放；已有收听者仍匿名。','Stop now: no more playback; the past listener stays anonymous.')}</p><p>{copy('再播一次：得到正在收听的账户号；你的私人声音会再外放 6 秒，然后关闭。','Play once: reveal the current listener account; your private voice plays for six more seconds, then stops.')}</p></aside><div className="mm-actions"><button onClick={()=>setConfirmation('stop-preview')}>{actionCopy['stop-preview'][locale==='zh'?0:1]}<Icon name="arrow"/></button><button onClick={()=>setConfirmation('trace-preview')}>{actionCopy['trace-preview'][locale==='zh'?0:1]}<Icon name="arrow"/></button></div>{(confirmation==='stop-preview'||confirmation==='trace-preview')&&<div className="mm-confirm"><p>{confirmation==='stop-preview'?copy('确认关闭预览，保留匿名记录？','Stop playback and keep the anonymous log?'):copy('确认让私人声音再外放 6 秒，以取得账户号？','Let the private voice play for six more seconds to get the account number?')}</p><button disabled={busy} onClick={()=>{act(selected.id,confirmation);setConfirmation(null)}}>{copy('确认这个选择','Confirm this choice')}</button><button onClick={()=>setConfirmation(null)}>{copy('再想想','Think again')}</button></div>}</>}
    <div className="mm-actions">{available(selected.id).map(a=><button key={a} disabled={busy||Boolean(error)} onClick={()=>act(selected.id,a)}>{actionCopy[a][locale==='zh'?0:1]}<Icon name="arrow"/></button>)}</div>
    {!available(selected.id).length&&selected.id!=='choice-desk'&&!(selected.id==='preview-screen'&&facts.previewLogRead&&facts.clerkPreviewAsked&&!facts.previewStopped&&!facts.previewTraced)&&<p className="mm-done">{copy('这里暂时没有新行动。','No new action here for now.')}</p>}
    {selected.id==='receipt'&&facts.receiptRead&&<button className="mm-read-more" onClick={()=>setZoom('receipt')}>{copy('放大回执','Enlarge receipt')} <Icon name="expand"/></button>}
    {selected.id==='seal'&&facts.sealRead&&<button className="mm-read-more" onClick={()=>setZoom('seal')}>{copy('放大封签','Enlarge seal')} <Icon name="expand"/></button>}
    {selected.id==='ledger'&&facts.ledgerRead&&<button className="mm-read-more" onClick={()=>setZoom('ledger')}>{copy('放大记录','Enlarge register')} <Icon name="expand"/></button>}
    {selected.id==='preview-screen'&&facts.previewLogRead&&<button className="mm-read-more" onClick={()=>setZoom('preview')}>{copy('放大播放记录','Enlarge playback log')} <Icon name="expand"/></button>}
   </>}
  </div>{activeDoc&&<div className="mm-zoom" role="dialog" aria-label={activeDoc.title}><button className="mm-zoom-close" onClick={()=>setZoom(null)} aria-label={copy('关闭放大资料','Close enlarged record')}><Icon name="close"/></button><small>{activeDoc.source}</small><h3>{activeDoc.title}</h3><p>{activeDoc.body}</p><span>{copy('仅供阅读 · 返回后保留当前进度','READ ONLY · YOUR PLACE IS SAVED')}</span></div>}</section></div>}
  {error&&<aside className="mm-error" role="alert"><p>{error}</p><button onClick={()=>void retry()}>{copy('重试','Retry')}</button></aside>}
 </main>
}
createRoot(document.getElementById('root')!).render(<App/>)
