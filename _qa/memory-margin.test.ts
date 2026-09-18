import test from 'node:test'
import assert from 'node:assert/strict'
import {initialHead,resolveAction,type Head} from '../src/journey'
import {entities,type EntityId} from '../src/world'

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
 head=step(head,'ledger','read-ledger').head
 return head
}

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
 assert.match(step(head,'voice-box','revisit-voice').text,/借用中/)
})
