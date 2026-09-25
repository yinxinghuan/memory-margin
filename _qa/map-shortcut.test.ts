import test from 'node:test';import assert from 'node:assert/strict';import {initialHead,resolveAction} from '../src/journey';import {entities} from '../src/world';import {mapRoute} from '../src/experience-shell';
test('a missing middle room is not silently removed from a route',()=>{assert.deepEqual(mapRoute('home','service',new Set(['home','service'])),[])});
test('map command requires prior visits and preserves narrative and history',()=>{
 let h=initialHead('en');const req=(action:string)=>({id:crypto.randomUUID(),version:h.version,scene:h.scene,entity:'home-door' as const,action,position:h.position});
 assert.equal(resolveAction(h,req('map-travel:service')).accepted,false);
 h=resolveAction(h,{...req('to-hall'),position:entities['home-door'].approach}).head;
 h=resolveAction(h,{...req('to-service'),entity:'service-door',position:entities['service-door'].approach}).head;
 const before=structuredClone(h),r=req('map-travel:home');h=resolveAction(h,r).head;assert.equal(h.scene,'home');assert.equal(h.version,before.version+1);assert.deepEqual(h.save.facts,before.save.facts);assert.deepEqual(h.save.inventory,before.save.inventory);assert.deepEqual(h.conversationHistory,before.conversationHistory);assert.deepEqual(h.save.blocks,before.save.blocks);assert.equal(h.save.map.find(n=>n.current)?.id,'home');assert.throws(()=>resolveAction(h,r),/VERSION_CONFLICT/);
});

import {indexedDB} from 'fake-indexeddb';import {JourneyStore} from '../src/storage';
test('shortcut receipt is idempotent and destination survives database reopen',async()=>{
 Object.assign(globalThis,{indexedDB});const name=`map-${crypto.randomUUID()}`;let store=await JourneyStore.open(name),h=await store.load('en');
 h=(await store.action({id:crypto.randomUUID(),version:h.version,scene:h.scene,entity:'home-door',action:'to-hall',position:entities['home-door'].approach})).head;
 const request={id:crypto.randomUUID(),version:h.version,scene:h.scene,entity:'home-door' as const,action:'map-travel:home',position:h.position};
 const result=await store.action(request);assert.equal(result.accepted,true);assert.deepEqual(await store.action(request),result);store.close();store=await JourneyStore.open(name);assert.deepEqual(await store.load('en'),result.head);assert.deepEqual(await store.action(request),result);store.close();
});
