import test from 'node:test'
import assert from 'node:assert/strict'
import {initialHead} from '../src/journey'
import {conversationTopics} from '../src/conversation'
import {appendConversationTurn} from '../src/conversation-history'
import {availableTopics} from '../src/conversation-flow'
test('each resident supports three committed rounds; refresh and language do not revive questions',()=>{
 for(const [person,met,root] of [['neighbor','neighborMet','arrival'],['caretaker','caretakerMet','authority'],['clerk','clerkMet','capacity']] as const){
 let h=initialHead('en');h.save.facts[met]=true
 for(let i=0;i<3;i++){
 const id=root+'-follow'.repeat(i),t=conversationTopics(person,h.save,h.conversationHistory).find(t=>t.id===id)!;assert.ok(t,id)
 const e='exchange-'+i;h.conversationHistory=appendConversationTurn(h.conversationHistory,{id:e+':player',characterId:person,speaker:'player',text:t.label,createdAt:0})
 h.conversationHistory=appendConversationTurn(h.conversationHistory,{id:e+':character',characterId:person,speaker:'character',text:t.reply,topicKey:t.key,createdAt:1})
 h=JSON.parse(JSON.stringify(h));h.save.locale=i%2?'en':'zh';assert.ok(!conversationTopics(person,h.save,h.conversationHistory).some(candidate=>candidate.id===id))
 }
 }
})
test('legacy exact bilingual pair migrates, incomplete exchange does not; new evidence opens only its variant',()=>{
 const h=initialHead('en');h.save.facts.neighborMet=true;h.save.facts.receiptRead=true
 const t=conversationTopics('neighbor',h.save).find(t=>t.id==='share-findings')!
 h.conversationHistory.turns=[{id:'e:player',characterId:'neighbor',speaker:'player',text:t.label,createdAt:0}]
 assert.ok(conversationTopics('neighbor',h.save,h.conversationHistory).some(t=>t.id==='share-findings'))
 h.conversationHistory.turns.push({id:'e:character',characterId:'neighbor',speaker:'character',text:t.reply,createdAt:1});h.save.locale='zh'
 assert.ok(!conversationTopics('neighbor',h.save,h.conversationHistory).some(t=>t.id==='share-findings'))
 h.save.facts.previewLogRead=true;assert.ok(conversationTopics('neighbor',h.save,h.conversationHistory).some(t=>t.key==='share-findings@preview-log'))
})
test('history retention and topic ledger do not regress after many exchanges',()=>{
 const h=initialHead('en');for(let i=0;i<70;i++)h.conversationHistory=appendConversationTurn(h.conversationHistory,{id:String(i),characterId:'neighbor',speaker:'player',text:'q',createdAt:i})
 assert.equal(h.conversationHistory.turns.length,70)
 const nodes=[{key:'route',utility:true},{key:'one'},{key:'two',after:'one'}]
 assert.deepEqual(availableTopics(nodes,[],['one']).map(n=>n.key),['two','route'])
 assert.deepEqual(availableTopics(nodes,[{topicKey:'one',question:'q',reply:''}]).map(n=>n.key),['route','one'])
})
