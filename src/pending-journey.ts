import type {Action,Head,Result} from './journey'
import type {JourneyStore} from './storage'
import type {Locale} from './story'
import {t} from './story'

const prefix='memory-margin-pending-v1:'
const legacy='memory-margin-pending-legacy'
const terminal=new Set(['VERSION_CONFLICT','ACTION_ID_CONFLICT','INVALID_ACTION_ID','ACTION_OUTSIDE_CONTRACT','MOVE_CLOSER'])
export type Settled=Result&{reconciled:boolean}
export const reconciliationText=(head:Head)=>t(head.save.locale,'旅程已有更新，已恢复最新进度。请根据当前设备重新选择行动。','The journey has changed. Latest progress is restored; choose an action for the current equipment.')
function parse(raw:string):Action{
 const a=JSON.parse(raw) as Action
 if(!a||typeof a.id!=='string'||!/^[-\w]{16,80}$/.test(a.id)||!Number.isSafeInteger(a.version)||typeof a.scene!=='string'||typeof a.entity!=='string'||typeof a.action!=='string'||!a.position||!Number.isFinite(a.position.x)||!Number.isFinite(a.position.y))throw new Error('INVALID_PENDING_ENVELOPE')
 return a
}
// Each intent has its own key. A late acknowledgement cannot erase another tab's request.
export class PendingJourney{
 constructor(private storage:Storage){}
 private quarantine(key:string,raw:string){this.storage.setItem('memory-margin-quarantine:'+crypto.randomUUID(),raw);if(this.storage.getItem(key)===raw)this.storage.removeItem(key)}
 put(action:Action){const key=prefix+action.id,raw=JSON.stringify(action),old=this.storage.getItem(key);if(old!==null&&old!==raw)throw new Error('PENDING_ID_CONFLICT');this.storage.setItem(key,raw)}
 acknowledge(action:Action){const key=prefix+action.id;if(this.storage.getItem(key)===JSON.stringify(action))this.storage.removeItem(key)}
 list():Action[]{
  const old=this.storage.getItem(legacy)
  if(old!==null){let action:Action|undefined;try{action=parse(old)}catch{this.quarantine(legacy,old)}if(action){this.put(action);if(this.storage.getItem(legacy)===old)this.storage.removeItem(legacy)}}
  const keys=Array.from({length:this.storage.length},(_,i)=>this.storage.key(i)).filter((key):key is string=>key!==null&&key.startsWith(prefix)),actions:Action[]=[]
  for(const key of keys){const raw=this.storage.getItem(key);if(raw===null)continue;try{const action=parse(raw);if(key!==prefix+action.id)throw new Error('KEY_MISMATCH');actions.push(action)}catch{this.quarantine(key,raw)}}
  return actions
 }
}
export async function settle(store:JourneyStore,action:Action,locale:Locale):Promise<Settled>{
 let result:Result
 try{result=await store.action(action)}catch(e){if(!(e instanceof Error)||!terminal.has(e.message))throw e;const head=await store.load(locale);return {head,text:reconciliationText(head),accepted:false,reconciled:true}}
 const head=await store.load(locale),reconciled=head.version!==result.head.version||head.scene!==result.head.scene
 return {...result,head,text:reconciled?reconciliationText(head):result.text,reconciled}
}
export async function performPending(store:JourneyStore,journal:PendingJourney,action:Action,locale:Locale,present:(result:Settled)=>Promise<void>){
 journal.put(action)
 const result=await settle(store,action,locale)
 await present(result)
 journal.acknowledge(action)
 return result
}
export async function recoverPending(store:JourneyStore,journal:PendingJourney,locale:Locale,present:(result:Settled)=>Promise<void>=async()=>{}){
 let head=await store.load(locale)
 for(const action of journal.list())head=(await performPending(store,journal,action,locale,present)).head
 return head
}
