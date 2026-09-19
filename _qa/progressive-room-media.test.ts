import test from 'node:test'
import assert from 'node:assert/strict'
import {MediaServiceError,type MediaTask} from '../scripts/media-service'
import {freshRoomMediaSnapshot,loadRoomMediaSnapshot,recoverRoomMedia,roomMediaAssetIds,roomMediaStorageKey,roomMediaTasks,saveRoomMediaSnapshot,type RoomMediaAssetId} from '../src/progressive-room-media'

const success=(id:RoomMediaAssetId):MediaTask=>({task_id:roomMediaTasks[id].taskId,request_id:roomMediaTasks[id].requestId,type:'image',status:'succeeded',created_at:1,updated_at:2,media:{type:'image',url:`https://cdn.example/${id}.png`,width:512,height:512,format:'png'}})
const memoryStorage=()=>{const values=new Map<string,string>();return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)},removeItem:(key:string)=>{values.delete(key)}}}

test('real task callbacks can reveal accepted assets one by one and persist them',async()=>{
 const storage=memoryStorage(),updates:string[]=[]
 const final=await recoverRoomMedia(freshRoomMediaSnapshot(),(snapshot,id)=>{updates.push(`${id}:${snapshot.assets[id].phase}`);saveRoomMediaSnapshot(storage,snapshot)},{readTask:async taskId=>{const id=roomMediaAssetIds.find(candidate=>roomMediaTasks[candidate].taskId===taskId)!;await new Promise(resolve=>setTimeout(resolve,roomMediaAssetIds.indexOf(id)));return success(id)}})
 assert.ok(roomMediaAssetIds.every(id=>final.assets[id].phase==='ready'))
 assert.ok(roomMediaAssetIds.every(id=>updates.includes(`${id}:checking`)&&updates.includes(`${id}:ready`)))
 assert.ok(roomMediaAssetIds.every(id=>loadRoomMediaSnapshot(storage as unknown as Storage).assets[id].phase==='ready'))
 assert.ok(storage.getItem(roomMediaStorageKey))
})

test('refresh restores accepted slots without resubmitting or repolling them',async()=>{
 const storage=memoryStorage(),ready=freshRoomMediaSnapshot()
 for(const id of roomMediaAssetIds)ready.assets[id]={...ready.assets[id],phase:'ready',remoteUrl:`https://cdn.example/${id}.png`}
 saveRoomMediaSnapshot(storage,ready)
 let calls=0
 const restored=loadRoomMediaSnapshot(storage as unknown as Storage)
 const final=await recoverRoomMedia(restored,()=>{},{readTask:async()=>{calls++;throw new Error('must not poll accepted task')}})
 assert.equal(calls,0)
 assert.ok(roomMediaAssetIds.every(id=>final.assets[id].phase==='ready'))
})

test('one terminal asset failure preserves that slot while the other assets finish',async()=>{
 const final=await recoverRoomMedia(freshRoomMediaSnapshot(),()=>{},{readTask:async taskId=>{
  const id=roomMediaAssetIds.find(candidate=>roomMediaTasks[candidate].taskId===taskId)!
  if(id==='buffer')throw new MediaServiceError('PROVIDER_REJECTED','fixture rejection',200,false)
  return success(id)
 }})
 assert.equal(final.assets.buffer.phase,'failed')
 assert.ok(roomMediaAssetIds.filter(id=>id!=='buffer').every(id=>final.assets[id].phase==='ready'))
})
