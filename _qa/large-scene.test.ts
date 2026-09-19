import test from 'node:test'
import assert from 'node:assert/strict'
import {findPath,walkable} from '../src/spatial/world'
import {largeDetailPackMeta,largeDetails,largeInterior,largePlacements,largeReviewWorld,largeSceneSpawns} from '../src/large-scene-world'

test('large concourse keeps every functional zone connected through two-axis travel',()=>{
 const targets=[largeSceneSpawns.center,largeSceneSpawns.west,largeSceneSpawns.east,largeSceneSpawns.north]
 for(const target of targets){
  assert.equal(walkable(largeReviewWorld,'large-review',target),true)
  const path=findPath(largeReviewWorld,'large-review',largeSceneSpawns.south,target)
  assert.ok(path.length>2,`missing route to ${target.x},${target.y}`)
 }
 assert.ok(findPath(largeReviewWorld,'large-review',largeSceneSpawns.west,largeSceneSpawns.east).length>2)
})

test('large furniture blocks feet while the cross-shaped circulation remains open',()=>{
 for(const placement of [...largePlacements,...largeDetails.filter(detail=>detail.obstacle).map(detail=>({id:detail.id,obstacle:detail.obstacle!}))]){
  const point={x:placement.obstacle.x+2,y:placement.obstacle.y+2}
  assert.equal(walkable(largeReviewWorld,'large-review',point),false,placement.id)
 }
 for(const point of [{x:378,y:250},{x:378,y:470},{x:240,y:470},{x:525,y:470}])assert.equal(walkable(largeReviewWorld,'large-review',point),true)
})

test('generated detail slots stay in their zone floor and keep a durable fallback contract',()=>{
 assert.equal(largeDetailPackMeta.generatedReady,true)
 assert.equal(largeDetailPackMeta.generatedSlots,12)
 assert.equal(largeDetailPackMeta.fallbackAssets.length,5)
 assert.equal(largeDetailPackMeta.rejectedAssets.some(asset=>asset.id==='queue-guide'),true)
 for(const detail of largeDetails){
  assert.ok(detail.rect.x>=largeInterior.x&&detail.rect.y>=largeInterior.y,detail.id)
  assert.ok(detail.rect.x+detail.rect.w<=largeInterior.x+largeInterior.w,detail.id)
  assert.ok(detail.rect.y+detail.rect.h<=largeInterior.y+largeInterior.h,detail.id)
 }
})
