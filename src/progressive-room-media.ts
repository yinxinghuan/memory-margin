import {getMediaTask,MediaServiceError,type MediaTask} from '../scripts/media-service'

export type RoomMediaAssetId='floor'|'scanner'|'comparator'|'buffer'
export type RoomMediaPhase='pending'|'checking'|'ready'|'failed'
export type RoomMediaEntry={taskId:string;requestId:string;phase:RoomMediaPhase;remoteUrl?:string;errorCode?:string}
export type RoomMediaSnapshot={version:1;assets:Record<RoomMediaAssetId,RoomMediaEntry>}
export type RoomMediaTaskReader=(taskId:string)=>Promise<MediaTask>

export const roomMediaTasks:Record<RoomMediaAssetId,{taskId:string;requestId:string;acceptedArt:string}>={
 floor:{taskId:'mt_9a9cd1d7456111068c50eda8c4b04d82',requestId:'da8f0db0-e45f-4609-b83f-66529ddeba01',acceptedArt:'./art/generated-room/audit-room-floor.png'},
 scanner:{taskId:'mt_1096e618826308085fcb12aff52f0121',requestId:'da2eef8e-05c3-4441-b774-c2e1e1c434c3',acceptedArt:'./art/generated-room/audit-resonance-scanner.png'},
 comparator:{taskId:'mt_8b5f913cd1ffdf39b4f2b5d05ad24d11',requestId:'ea3ced4e-63e4-483a-9024-4cd573281335',acceptedArt:'./art/generated-room/audit-comparison-console.png'},
 buffer:{taskId:'mt_279ce84476d13322d4bfee944e847c70',requestId:'e71c8562-860f-47e6-afb2-de03e6116ba4',acceptedArt:'./art/generated-room/audit-sealed-buffer.png'},
}
export const roomMediaAssetIds=Object.keys(roomMediaTasks) as RoomMediaAssetId[]
export const roomMediaStorageKey='memory-margin-generated-audit-room-media-v1'
const localMediaApiBase=()=>typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname)?'/__alteru_media__':undefined

export function freshRoomMediaSnapshot():RoomMediaSnapshot{
 return {version:1,assets:Object.fromEntries(roomMediaAssetIds.map(id=>[id,{taskId:roomMediaTasks[id].taskId,requestId:roomMediaTasks[id].requestId,phase:'pending'}])) as RoomMediaSnapshot['assets']}
}

export function loadRoomMediaSnapshot(storage:Pick<Storage,'getItem'>):RoomMediaSnapshot{
 try{
  const raw=JSON.parse(storage.getItem(roomMediaStorageKey)??'null') as RoomMediaSnapshot|null
  if(raw?.version!==1)return freshRoomMediaSnapshot()
  const next=freshRoomMediaSnapshot()
  for(const id of roomMediaAssetIds){
   const saved=raw.assets?.[id],expected=roomMediaTasks[id]
   if(saved?.taskId===expected.taskId&&saved.requestId===expected.requestId&&['pending','checking','ready','failed'].includes(saved.phase))next.assets[id]={...saved}
  }
  return next
 }catch{return freshRoomMediaSnapshot()}
}

export function saveRoomMediaSnapshot(storage:Pick<Storage,'setItem'>,snapshot:RoomMediaSnapshot){storage.setItem(roomMediaStorageKey,JSON.stringify(snapshot))}
const delay=(ms:number,signal?:AbortSignal)=>new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,ms);signal?.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'))},{once:true})})

export async function recoverRoomMedia(
 initial:RoomMediaSnapshot,
 onUpdate:(snapshot:RoomMediaSnapshot,id:RoomMediaAssetId)=>void,
 options?:{readTask?:RoomMediaTaskReader;signal?:AbortSignal;pollIntervalMs?:number},
):Promise<RoomMediaSnapshot>{
 let snapshot:RoomMediaSnapshot={version:1,assets:Object.fromEntries(roomMediaAssetIds.map(id=>[id,{...initial.assets[id]}])) as RoomMediaSnapshot['assets']}
 const emit=(id:RoomMediaAssetId,entry:RoomMediaEntry)=>{snapshot={version:1,assets:{...snapshot.assets,[id]:entry}};onUpdate(snapshot,id)}
 const reader=options?.readTask??(taskId=>getMediaTask(taskId,{signal:options?.signal,baseUrl:localMediaApiBase()}))
 await Promise.all(roomMediaAssetIds.map(async id=>{
  const expected=roomMediaTasks[id],current=snapshot.assets[id]
  if(current.phase==='ready'&&current.taskId===expected.taskId&&current.requestId===expected.requestId)return
  emit(id,{taskId:expected.taskId,requestId:expected.requestId,phase:'checking'})
  while(!options?.signal?.aborted){
   try{
    const task=await reader(expected.taskId)
    if(task.task_id!==expected.taskId||task.request_id!==expected.requestId){emit(id,{taskId:expected.taskId,requestId:expected.requestId,phase:'failed',errorCode:'TASK_IDENTITY_MISMATCH'});return}
    if(task.status==='succeeded'&&task.media?.type==='image'){emit(id,{taskId:expected.taskId,requestId:expected.requestId,phase:'ready',remoteUrl:task.media.url});return}
    if(task.status==='failed'){emit(id,{taskId:expected.taskId,requestId:expected.requestId,phase:'failed',errorCode:task.error?.code??'GENERATION_FAILED'});return}
    emit(id,{taskId:expected.taskId,requestId:expected.requestId,phase:'pending'})
    await delay(Math.max(8000,options?.pollIntervalMs??8000),options?.signal)
   }catch(error){
    if(options?.signal?.aborted||(error instanceof DOMException&&error.name==='AbortError'))return
    if(error instanceof MediaServiceError&&!error.retryable){emit(id,{taskId:expected.taskId,requestId:expected.requestId,phase:'failed',errorCode:error.code});return}
    emit(id,{taskId:expected.taskId,requestId:expected.requestId,phase:'pending',errorCode:error instanceof MediaServiceError?error.code:'NETWORK_ERROR'});return
   }
  }
 }))
 return snapshot
}
