import test from 'node:test'
import assert from 'node:assert/strict'
import {entities,entityNear,portals,world,type EntityId,type Scene} from '../src/world'
import {walkable} from '../src/spatial/world'

const cases:Array<{id:EntityId;scene:Scene;threshold:{x:number;y:number};arrival:keyof typeof portals}>=[
 {id:'home-door',scene:'home',threshold:{x:184,y:64},arrival:'to-home'},
 {id:'home-return',scene:'hall',threshold:{x:54,y:160},arrival:'to-hall'},
 {id:'service-door',scene:'hall',threshold:{x:321,y:368},arrival:'service-to-hall'},
 {id:'service-exit',scene:'service',threshold:{x:184,y:436},arrival:'to-service'},
]

test('every door activates at its threshold and at its authored approach',()=>{
 for(const item of cases){
  const door=entities[item.id]
  assert.deepEqual(door.threshold,item.threshold,`${item.id} threshold must stay in the authored doorway record`)
  assert.ok(walkable(world,item.scene,door.approach),`${item.id} approach must be reachable`)
  assert.ok(entityNear(door,door.approach),`${item.id} approach must activate the door`)
  assert.ok(walkable(world,item.scene,item.threshold),`${item.id} threshold must be walkable`)
  assert.ok(entityNear(door,item.threshold),`${item.id} threshold must activate the door`)
 }
})

test('portal arrivals stay inside the destination door activation zone',()=>{
 for(const item of cases){
  assert.equal(portals[item.arrival].target,item.id,`${item.arrival} must name its destination doorway`)
  assert.ok(entityNear(entities[item.id],portals[item.arrival].position),`${item.arrival} arrival must activate ${item.id}`)
 }
})
