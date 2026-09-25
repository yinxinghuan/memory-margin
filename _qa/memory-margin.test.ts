import test from 'node:test'
import assert from 'node:assert/strict'
import {initialHead,migrateHead,resolveAction,type Head} from '../src/journey'
import {objective} from '../src/story'
import {entities,entityNear,type EntityId} from '../src/world'

function step(head:Head,entity:EntityId,action:string){
 const result=resolveAction(head,{id:crypto.randomUUID(),version:head.version,scene:head.scene,entity,action,position:entities[entity].approach})
 assert.equal(result.accepted,true,`${entity}: ${action} — ${result.text}`)
 return result
}
function evidenceRoute(){
 let head=initialHead('zh')
 head=step(head,'voice-box','listen-voice').head
 head=step(head,'receipt','read-receipt').head
 head=step(head,'home-door','to-hall').head
 assert.equal(head.scene,'hall')
 head=step(head,'neighbor','talk-neighbor').head
 head=step(head,'caretaker','talk-caretaker').head
 head=step(head,'seal','read-seal').head
 head=step(head,'service-door','to-service').head
 assert.equal(head.scene,'service')
 head=step(head,'clerk','talk-clerk').head
 head=step(head,'service-exit','service-to-hall').head
 head=step(head,'commons-door','to-commons').head
 head=step(head,'archive-door','to-archive').head
 head=step(head,'ledger','read-ledger').head
 head=step(head,'archive-return','archive-to-commons').head
 head=step(head,'commons-return','commons-to-hall').head
 head=step(head,'service-door','to-service').head
 return head
}

test('visible interaction range and authoritative action range share one predicate',()=>{
 const entity=entities['voice-box']
 const visibleEdge={x:entity.approach.x+32,y:entity.approach.y}
 assert.equal(entityNear(entity,visibleEdge),true)
 assert.equal(resolveAction(initialHead('zh'),{id:crypto.randomUUID(),version:0,scene:'home',entity:'voice-box',action:'listen-voice',position:visibleEdge}).accepted,true)
 const outside={x:entity.approach.x+34,y:entity.approach.y}
 assert.equal(entityNear(entity,outside),false)
 assert.throws(()=>resolveAction(initialHead('zh'),{id:crypto.randomUUID(),version:0,scene:'home',entity:'voice-box',action:'listen-voice',position:outside}),/MOVE_CLOSER/)
})

test('new arrival learns the missing-memory rule through sources before deciding',()=>{
 let head=initialHead('zh')
 const premature=resolveAction(head,{id:crypto.randomUUID(),version:0,scene:'home',entity:'receipt',action:'read-receipt',position:entities.receipt.approach})
 assert.equal(premature.accepted,false)
 assert.equal(premature.head.version,0)
 head=evidenceRoute()
 const compared=step(head,'choice-desk','compare-records')
 assert.match(compared.text,/30 天/)
 head=step(compared.head,'choice-desk','choose-keep').head
 assert.equal(head.save.facts.kept,true)
 assert.equal(head.save.facts.lent,false)
 head=step(head,'service-exit','service-to-hall').head
 head=step(head,'home-return','to-home').head
 assert.equal(head.scene,'home')
 const ending=step(head,'voice-box','revisit-voice')
 assert.match(ending.text,/面馆/)
 assert.equal(ending.head.save.facts.voiceRevisited,true)
 assert.match(objective(ending.head.save),/早餐/)
 const morning=step(ending.head,'voice-box','try-save-morning')
 assert.equal(morning.head.save.facts.morningHandled,true)
 assert.equal(morning.head.save.facts.morningStored,false)
})

test('lending retains the gap, survives return route, and prevents the other choice',()=>{
 let head=step(evidenceRoute(),'choice-desk','compare-records').head
 head=step(head,'choice-desk','choose-lend').head
 assert.equal(head.save.facts.lent,true)
 const other=resolveAction(head,{id:crypto.randomUUID(),version:head.version,scene:'service',entity:'choice-desk',action:'choose-keep',position:entities['choice-desk'].approach})
 assert.equal(other.accepted,false)
 assert.equal(other.head.version,head.version)
 head=step(head,'service-exit','service-to-hall').head
 head=step(head,'home-return','to-home').head
 head=step(head,'voice-box','revisit-voice').head
 assert.match(head.save.blocks.at(-1)?.text??'',/借用中/)
 head=step(head,'voice-box','save-morning').head
 assert.equal(head.save.facts.morningStored,true)
})

function toPreview(choice:'choose-keep'|'choose-lend'){
 let head=step(evidenceRoute(),'choice-desk','compare-records').head
 head=step(head,'choice-desk',choice).head
 head=step(head,'service-exit','service-to-hall').head
 head=step(head,'home-return','to-home').head
 head=step(head,'voice-box','revisit-voice').head
 head=step(head,'home-door','to-hall').head
 head=step(head,'neighbor','ask-neighbor-preview').head
 head=step(head,'service-door','to-service').head
 head=step(head,'preview-screen','read-preview-log').head
 head=step(head,'clerk','confront-clerk-preview').head
 return head
}

test('kept memory can stop unauthorized preview and neighbor sees the result',()=>{
 let head=toPreview('choose-keep')
 assert.throws(()=>resolveAction(head,{id:crypto.randomUUID(),version:head.version,scene:'service',entity:'preview-screen',action:'debrief-neighbor',position:entities['preview-screen'].approach}),/ACTION_OUTSIDE_CONTRACT/)
 head=step(head,'preview-screen','stop-preview').head
 assert.equal(head.save.facts.previewStopped,true)
 const trace=resolveAction(head,{id:crypto.randomUUID(),version:head.version,scene:'service',entity:'preview-screen',action:'trace-preview',position:entities['preview-screen'].approach})
 assert.equal(trace.accepted,false)
 head=step(head,'service-exit','service-to-hall').head
 assert.match(step(head,'neighbor','debrief-neighbor').text,/黑下来的窗口/)
})

test('lent memory can trade one more playback for a listener account',()=>{
 let head=toPreview('choose-lend')
 head=step(head,'preview-screen','trace-preview').head
 assert.equal(head.save.facts.previewTraced,true)
 assert.match(head.save.blocks.at(-1)?.text??'',/C-09/)
 head=step(head,'service-exit','service-to-hall').head
 assert.match(step(head,'neighbor','debrief-neighbor').text,/C-09/)
})

test('a saved first-arc journey gains new facts without losing its earlier choice',()=>{
 let head=step(evidenceRoute(),'choice-desk','compare-records').head
 head=step(head,'choice-desk','choose-keep').head
 const old={...head,save:{...head.save,facts:Object.fromEntries(Object.entries(head.save.facts).filter(([id])=>!['previewLogRead','previewStopped','neighborPreview'].includes(id)))}}
 const migrated=migrateHead(old)
 assert.equal(migrated.version,head.version)
 assert.equal(migrated.save.facts.kept,true)
 assert.equal(migrated.save.facts.previewLogRead,false)
 assert.equal(migrated.save.facts.previewStopped,false)
 assert.equal(migrated.save.facts.morningHandled,false)
 assert.equal(migrateHead(migrated),migrated)
})

test('older journeys gain an empty conversation history without changing story progress',()=>{
 const head=initialHead('zh')
 const old={version:head.version,scene:head.scene,position:head.position,save:head.save} as Head
 const migrated=migrateHead(old)
 assert.deepEqual(migrated.conversationHistory,{version:1,turns:[]})
 assert.equal(migrated.save,head.save)
})
