import test from 'node:test'
import assert from 'node:assert/strict'
import {findPath,walkable} from '../src/spatial/world'
import {auditPlacements,auditRoomWorld,auditTargets} from '../src/generated-room-world'

test('generated authenticity room keeps every functional station reachable',()=>{
 const spawn=auditRoomWorld.scenes['generated-audit-room'].spawn
 for(const [id,target] of Object.entries(auditTargets)){
  assert.equal(walkable(auditRoomWorld,'generated-audit-room',target),true,id)
  assert.ok(findPath(auditRoomWorld,'generated-audit-room',spawn,target).length>2,id)
 }
})

test('every generated room device owns a blocking footprint',()=>{
 for(const item of auditPlacements)assert.equal(walkable(auditRoomWorld,'generated-audit-room',{x:item.obstacle.x+2,y:item.obstacle.y+2}),false,item.id)
})

test('pending room shell and completed art share one authoritative layout',()=>{
 assert.equal(auditRoomWorld.scenes['generated-audit-room'].obstacles.length,auditPlacements.length)
 for(const item of auditPlacements)assert.ok(auditRoomWorld.scenes['generated-audit-room'].obstacles.includes(item.obstacle),`${item.id} must keep the same collision while art is pending`)
})
