import test from 'node:test'
import assert from 'node:assert/strict'
import {detectLocale} from '../src/locale'
import {initialHead} from '../src/journey'
import {dialogueMessages,requestDialogue} from '../src/free-dialogue'

test('non-Chinese systems default to English; explicit supported locale wins',()=>{
 for(const language of ['fr-FR','ja-JP','en-US','de-DE'])assert.equal(detectLocale(null,[language]),'en')
 assert.equal(detectLocale(null,['zh-Hant-TW']),'zh')
 assert.equal(detectLocale('en',['zh-CN']),'en')
 assert.equal(detectLocale('invalid',['es-ES']),'en')
})
test('free dialogue requires visible introduction and does not mutate authoritative facts',async()=>{
 const head=initialHead('en')
 assert.throws(()=>dialogueMessages(head,'neighbor','Hi'),/INTRODUCTION_REQUIRED/)
 head.save.facts.neighborMet=true
 const before=structuredClone(head),messages=dialogueMessages(head,'neighbor','How do you cope?')
 assert.equal(messages.at(-1)?.content,'How do you cope?')
 assert.ok(!messages[0].content.includes('C-09'))
 assert.ok(!messages[0].content.includes('23:17'))
 const text=await requestDialogue(head,'neighbor','How do you cope?',new AbortController().signal,async(_url,init)=>{
  assert.equal(JSON.parse(init!.body as string).messages.at(-1).role,'user')
  return new Response(JSON.stringify({choices:[{message:{content:'One morning at a time.'}}]}))
 })
 assert.equal(text,'One morning at a time.')
 assert.deepEqual(head,before)
})
test('free dialogue propagates errors instead of inventing an offline reply',async()=>{
 const head=initialHead('en');head.save.facts.neighborMet=true
 await assert.rejects(requestDialogue(head,'neighbor','Hi',new AbortController().signal,async()=>new Response('',{status:503})),/DIALOGUE_HTTP_503/)
 await assert.rejects(requestDialogue(head,'neighbor','Hi',new AbortController().signal,async()=>new Response('{}')),/INVALID_DIALOGUE_RESPONSE/)
})
