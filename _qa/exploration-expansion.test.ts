import test from 'node:test'
import assert from 'node:assert/strict'
import {initialHead,migrateHead,resolveAction,type Head} from '../src/journey'
import {entities,world,portals,entityNear,type EntityId,type Scene} from '../src/world'
import {findPath,walkable} from '../src/spatial/world'
import {discoveries,explorationComplete} from '../src/exploration'
import {objective} from '../src/story'
import {mapRoute} from '../src/experience-shell'
function step(h:Head,id:EntityId,action=entities[id].actions[0]){const r=resolveAction(h,{id:crypto.randomUUID(),version:h.version,scene:h.scene,entity:id,action,position:entities[id].approach});assert.equal(r.accepted,true,r.text);return r.head}
test('seven rooms have reachable exits and observations, and every portal lands at its real door',()=>{
 assert.equal(Object.keys(world.scenes).length,7)
 for(const [id,e] of Object.entries(entities))assert.ok(findPath(world,e.scene,world.scenes[e.scene].spawn,e.approach).length,`unreachable ${id}`)
 for(const [id,p] of Object.entries(portals)){assert.ok(walkable(world,p.scene,p.position),id);assert.ok(entityNear(entities[p.target],p.position),`arrival outside ${id}`);assert.ok(Object.values(portals).some(back=>back.from===p.scene&&back.scene===p.from),id)}
})
test('a new player can experience all four new rooms using authoritative actions and return',()=>{
 let h=initialHead('en');h=step(h,'voice-box');h=step(h,'receipt');h=step(h,'home-door');h=step(h,'neighbor');h=step(h,'commons-door')
 h=step(h,'scent-station');h=step(h,'neighbor-door');h=step(h,'neighbor-keepsake');h=step(h,'neighbor-return');h=step(h,'repair-door');h=step(h,'repair-scanner');h=step(h,'repair-return');h=step(h,'archive-door');h=step(h,'archive-index');h=step(h,'ledger');h=step(h,'archive-return');h=step(h,'commons-return')
 assert.equal(h.scene,'hall');assert.ok(explorationComplete(h.save.facts));assert.equal(h.save.facts.ledgerRead,true)
 assert.deepEqual(mapRoute('archive','neighbor-room',new Set(['archive','commons','neighbor-room'])),['archive','commons','neighbor-room'])
})
test('private room requires invitation; diagnosis requires a receipt; quick travel cannot skip first visits',()=>{
 let h=initialHead('en');h=step(h,'home-door');h=step(h,'commons-door')
 const request=(id:EntityId,action=entities[id].actions[0])=>({id:crypto.randomUUID(),version:h.version,scene:h.scene,entity:id,action,position:entities[id].approach})
 assert.equal(resolveAction(h,request('neighbor-door')).accepted,false)
 assert.equal(resolveAction(h,{...request('repair-door'),action:'map-travel:repair'}).accepted,false)
 h=step(h,'repair-door');assert.equal(resolveAction(h,request('repair-scanner')).accepted,false)
})
test('completed three-room saves gain new places without altering decisions, location or history',()=>{
 const old=initialHead('zh');old.scene='service';old.save.facts.kept=true;old.save.facts.neighborMet=true;old.save.facts.neighborDebriefed=true;old.save.map=old.save.map.filter(r=>['home','hall','service'].includes(r.id));for(const d of discoveries)delete old.save.facts[d.fact]
 const next=migrateHead(old);assert.equal(next.save.map.length,7);assert.equal(next.scene,'service');assert.equal(next.save.facts.kept,true);assert.deepEqual(next.conversationHistory,old.conversationHistory);assert.match(objective(next.save),/公共生活区/);assert.equal(migrateHead(next),next)
 for(const d of discoveries)next.save.facts[d.fact]=true
 assert.match(objective(next.save),/本章探索完成/)
})
