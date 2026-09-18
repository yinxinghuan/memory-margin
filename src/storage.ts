import {GAME_ID} from './game-id'
import {deploymentScope} from './spatial/storage-scope'
import {initialHead,resolveAction,type Head,type Action,type Result} from './journey'
import {type Locale} from './story'
import {world,type Scene} from './world'
import {walkable,type Point} from './spatial/world'
const req=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
const finished=(tx:IDBTransaction)=>new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('STORAGE_ABORTED'));tx.onerror=()=>reject(tx.error)})
export class JourneyStore{
 constructor(readonly db:IDBDatabase){}
 static async open(name=`alteru:${typeof location==='undefined'?GAME_ID:deploymentScope(GAME_ID,location.hostname,location.pathname)}:memory-margin-journey-v1`){const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{r.result.createObjectStore('heads');r.result.createObjectStore('actions')};return new JourneyStore(await req(r))}
 async load(locale:Locale){const tx=this.db.transaction('heads','readwrite'),done=finished(tx),store=tx.objectStore('heads');let head=await req(store.get('active')) as Head|undefined;if(!head){head=initialHead(locale);store.put(head,'active')}await done;return head}
 async action(request:Action):Promise<Result>{
  const tx=this.db.transaction(['heads','actions'],'readwrite'),done=finished(tx);void done.catch(()=>{});
  try{const receipts=tx.objectStore('actions'),digest=JSON.stringify(request),old=await req(receipts.get(request.id));if(old){if(old.digest!==digest)throw new Error('ACTION_ID_CONFLICT');await done;return old.result}
   const heads=tx.objectStore('heads'),head=await req(heads.get('active')) as Head,result=resolveAction(head,request)
   if(result.accepted)heads.put(result.head,'active');receipts.put({digest,result},request.id);await done;return result
  }catch(error){try{tx.abort()}catch{};throw error}
 }
 async checkpoint(scene:Scene,version:number,position:Point){const tx=this.db.transaction('heads','readwrite'),done=finished(tx);void done.catch(()=>{});try{const store=tx.objectStore('heads'),head=await req(store.get('active')) as Head;if(head.scene!==scene||head.version!==version)throw new Error('STALE_POSITION');if(!walkable(world,scene,position))throw new Error('INVALID_POSITION');store.put({...head,position:{...position}},'active');await done}catch(error){try{tx.abort()}catch{};throw error}}
 close(){this.db.close()}
}
