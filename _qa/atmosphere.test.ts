import test from 'node:test'
import assert from 'node:assert/strict'
import {atmosphereObstacles,homeAtlasPlacements,serviceAtlasPlacements} from '../src/atmosphere'
import {walkable,type World} from '../src/spatial/world'
import {entities,world} from '../src/world'

test('independent ambient furniture owns collision while small lived-in items stay passable',()=>{
 const obstacles=atmosphereObstacles('props','home')
 assert.equal(obstacles.length,3)
 assert.deepEqual(obstacles,homeAtlasPlacements.flatMap(p=>p.obstacle?[p.obstacle]:[]))
 const world:World={width:384,height:512,step:4,actor:{w:9,h:15},scenes:{home:{interior:{x:54,y:64,w:276,h:390},spawn:{x:190,y:366},obstacles}}}
 for(const furniture of homeAtlasPlacements.filter(p=>p.obstacle)){
  assert.equal(walkable(world,'home',{x:furniture.obstacle!.x,y:furniture.obstacle!.y}),false)
 }
 for(const y of [120,200,280,360,420])assert.equal(walkable(world,'home',{x:190,y}),true,'center route must remain open')
})

test('the second scene keeps its route and authored interactions reachable',()=>{
 const obstacles=atmosphereObstacles('props','service')
 assert.equal(obstacles.length,3)
 assert.deepEqual(obstacles,serviceAtlasPlacements.flatMap(p=>p.obstacle?[p.obstacle]:[]))
 const serviceWorld:World={width:384,height:512,step:4,actor:{w:9,h:15},scenes:{service:{interior:{x:54,y:64,w:276,h:390},spawn:{x:187,y:380},obstacles}}}
 for(const y of [100,180,260,340,420])assert.equal(walkable(serviceWorld,'service',{x:190,y}),true,'service center route must remain open')
 for(const id of ['clerk','ledger','terms-card','choice-desk','preview-screen','service-exit'] as const){
  assert.equal(walkable(world,'service',entities[id].approach),true,`${id} approach must remain walkable`)
 }
})
