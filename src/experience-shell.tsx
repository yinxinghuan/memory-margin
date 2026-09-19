import {useMemo,useState} from 'react'
import type {Scene,EntityId} from './world'
import {sceneLabels} from './world'
import type {StorySave,Locale} from './story'
import {t,objective} from './story'

export type RecordEntry={id:string;title:string;source:string;known:boolean;body:string}
export type ShellTab='goal'|'items'|'clues'|'people'

const positions:Record<Scene,[number,number]>={home:[18,64],hall:[50,36],service:[82,64]}
const links:[Scene,Scene][]=[['home','hall'],['hall','service']]
const mapOrder:Scene[]=['home','hall','service']

export function mapRoute(scene:Scene,destination:Scene,visited:ReadonlySet<string>){
 const from=mapOrder.indexOf(scene),to=mapOrder.indexOf(destination)
 const segment=mapOrder.slice(Math.min(from,to),Math.max(from,to)+1)
 return (from<=to?segment:segment.reverse()).filter(id=>visited.has(id))
}

export function MemoryMap({save,scene,locale}:{save:StorySave;scene:Scene;locale:Locale}){
 const copy=(zh:string,en:string)=>t(locale,zh,en)
 const visited=new Set(save.map.filter(node=>node.visited).map(node=>node.id))
 const [destination,setDestination]=useState<Scene>(scene)
 const route=useMemo(()=>{
  if(destination===scene)return [scene]
  return mapRoute(scene,destination,visited)
 },[destination,scene,save.map])
 const reachable=route.at(-1)===destination
 const first=route[1]
 const direction=first?copy(first==='home'?'从走廊左侧门返回转生居所。':first==='hall'?(scene==='home'?'从北侧门进入公共走廊。':'从南侧门回到公共走廊。'):'从走廊右侧门进入记忆服务点。',first==='home'?'Use the west door in the hall to return home.':first==='hall'?(scene==='home'?'Use the north door to enter the shared hall.':'Use the south exit to return to the shared hall.'):'Use the east door in the hall to enter memory service.'):copy('选择另一处已到访地点查看路线。','Select another visited place for directions.')
 return <div className="mm-atlas">
  <div className="mm-atlas-location"><span>{copy('你在这里','YOU ARE HERE')}</span><strong>{sceneLabels[scene][locale==='zh'?0:1]}</strong></div>
  <div className="mm-atlas-viewport"><svg viewBox="0 0 100 100" aria-hidden="true">{links.map(([a,b])=><line key={a+b} x1={positions[a][0]} y1={positions[a][1]} x2={positions[b][0]} y2={positions[b][1]} data-open={visited.has(a)&&visited.has(b)}/>)}</svg>{(Object.keys(positions) as Scene[]).map(id=><button key={id} style={{left:`${positions[id][0]}%`,top:`${positions[id][1]}%`}} disabled={!visited.has(id)} aria-current={id===scene?'location':undefined} aria-pressed={id===destination} onClick={()=>setDestination(id)}><i/><span>{sceneLabels[id][locale==='zh'?0:1]}</span></button>)}</div>
  <section className="mm-atlas-route"><small>{destination===scene?copy('当前位置','CURRENT LOCATION'):copy('前往','DESTINATION')}</small><strong>{sceneLabels[destination][locale==='zh'?0:1]}</strong><p>{reachable?direction:copy('这里尚未发现可用路线。','No known route reaches this place yet.')}</p>{route.length>1&&<ol>{route.slice(1).map((id,index)=><li key={id}><span>{index+1}</span>{sceneLabels[id][locale==='zh'?0:1]}</li>)}</ol>}</section>
 </div>
}

export function MemoryBackpack({save,records,tab,setTab,onRead}:{save:StorySave;records:RecordEntry[];tab:ShellTab;setTab:(tab:ShellTab)=>void;onRead:(id:string)=>void}){
 const copy=(zh:string,en:string)=>t(save.locale,zh,en),f=save.facts
 const people=[f.neighborMet&&{id:'neighbor',name:copy('安禾','Anhe'),role:copy('邻居','Neighbor'),detail:f.neighborPreview?copy('听过窗口外放的私人声音，愿意说明昨夜发生的事。','Heard the private voice at the counter and will describe last night.'):copy('把面包递给你，也提醒你查看封签。','Offered bread and pointed you to the seal.')},f.caretakerMet&&{id:'caretaker',name:copy('骆叔','Luo'),role:copy('值守人','Attendant'),detail:f.caretakerPreviewAsked?copy('拦住空白代签，却无权阻止窗口预览。','Stopped a blank signature but could not stop counter previews.'):copy('说话生硬，实际阻止了空白授权。','Speaks harshly and stopped the blank authorization.')},f.clerkMet&&{id:'clerk',name:copy('乔弥','Qiaomi'),role:copy('窗口职员','Counter clerk'),detail:f.clerkPreviewAsked?copy('承认授权空白时已外放六秒，仍把它称作预览。','Admitted six seconds played with blank consent and still calls it preview.'):copy('用“保住记忆”劝你签下借用。','Frames lending as protecting your memory.')}].filter(Boolean) as {id:string;name:string;role:string;detail:string}[]
 const tabs:[ShellTab,string][]=[['goal',copy('目标','Goal')],['items',copy('物品','Items')],['clues',copy('线索','Clues')],['people',copy('人物','People')]]
 return <div className="mm-backpack"><nav>{tabs.map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
  {tab==='goal'&&<section className="mm-backpack-goal"><small>{copy('当前目标','CURRENT OBJECTIVE')}</small><p>{objective(save)}</p><div><span>{save.inventory.reduce((n,item)=>n+item.count,0)} {copy('件物品','items')}</span><span>{records.filter(row=>row.known).length} {copy('条线索','clues')}</span><span>{people.length} {copy('位人物','people')}</span></div></section>}
  {tab==='items'&&(save.inventory.length?<ul className="mm-backpack-list">{save.inventory.map(item=><li key={item.id}><strong>{item.label}{item.count>1&&` × ${item.count}`}</strong><p>{item.detail}</p></li>)}</ul>:<p className="mm-empty">{copy('还没有随身物品。','You are not carrying anything yet.')}</p>)}
  {tab==='clues'&&(records.some(row=>row.known)?<ul className="mm-backpack-list">{records.filter(row=>row.known).map(row=><li key={row.id}><button onClick={()=>onRead(row.id)}><span><strong>{row.title}</strong><small>{row.source}</small></span></button></li>)}</ul>:<p className="mm-empty">{copy('亲自发现的线索会记在这里。','Clues you discover will be kept here.')}</p>)}
  {tab==='people'&&(people.length?<ul className="mm-backpack-list">{people.map(person=><li key={person.id}><strong>{person.name}</strong><small>{person.role}</small><p>{person.detail}</p></li>)}</ul>:<p className="mm-empty">{copy('遇见并交谈后，人物会记在这里。','People appear here after you meet and talk.')}</p>)}
 </div>
}

export function MemoryMenu({locale,muted,onToggleSound,onRestart}:{locale:Locale;muted:boolean;onToggleSound:()=>void;onRestart:()=>void}){
 const copy=(zh:string,en:string)=>t(locale,zh,en),[section,setSection]=useState<'game'|'save'>('game'),[confirm,setConfirm]=useState(false)
 return <div className="mm-menu"><nav><button aria-pressed={section==='game'} onClick={()=>setSection('game')}>{copy('游戏','Game')}</button><button aria-pressed={section==='save'} onClick={()=>setSection('save')}>{copy('存档','Save')}</button></nav>{section==='game'?<>
  <button className="mm-menu-row" aria-pressed={!muted} onClick={onToggleSound}><span>{copy('声音','Sound')}</span><strong>{muted?copy('关','Off'):copy('开','On')}</strong></button>
  <details open><summary>{copy('操作方法','Controls')}</summary><p>{copy('点击地面、拖动左下摇杆，或用方向键/WASD 行走。点击物件会先走近；再按右下行动键查看、交谈或通过出入口。','Tap the ground, use the lower-left stick, or move with arrow keys/WASD. Tap an object to approach it, then use the lower-right action to examine, talk, or enter.')}</p><p>{copy('人物可以反复交谈；目标、物品、线索和人物都在“背包”里。','You can return to conversations. Goal, items, clues, and people are in Backpack.')}</p></details>
 </>:<><section className="mm-save-card"><small>{copy('当前存档','CURRENT SAVE')}</small><strong>{copy('转生后的第一天','First day after transfer')}</strong><p>{copy('探索与选择会自动保存在当前浏览器。','Exploration and choices are saved automatically in this browser.')}</p></section>{confirm?<div className="mm-confirm"><p>{copy('重新开始会替换当前浏览器里的这段旅程。','Restarting replaces this journey in the current browser.')}</p><button onClick={onRestart}>{copy('确认重新开始','Confirm restart')}</button><button onClick={()=>setConfirm(false)}>{copy('取消','Cancel')}</button></div>:<button className="mm-menu-restart" onClick={()=>setConfirm(true)}>{copy('重新开始','Restart')}</button>}</>}</div>
}
