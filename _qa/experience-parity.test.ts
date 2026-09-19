import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {applyAction,initialStory} from '../src/story'
import {conversationPages,conversationTopics,freeConversationReply} from '../src/conversation'
import {mapRoute} from '../src/experience-shell'

test('every introduced physical person keeps repeatable state-aware conversation topics',()=>{
 let save=initialStory('zh')
 for(const [entity,action] of [['neighbor','talk-neighbor'],['caretaker','talk-caretaker'],['clerk','talk-clerk']] as const){
  save=applyAction(save,action).save
  const topics=conversationTopics(entity,save)
  assert.ok(topics.length>=2,`${entity} should remain conversational after introduction`)
  assert.ok(topics.every(topic=>topic.label&&topic.reply))
  assert.ok(freeConversationReply(entity,save,'我有点担心').length>10)
 }
 save={...save,facts:{...save.facts,previewLogRead:true}}
 assert.ok(conversationTopics('caretaker',save).some(topic=>topic.id==='six-seconds'))
 assert.ok(conversationTopics('clerk',save).some(topic=>topic.id==='consent'))
 for(const entity of ['neighbor','caretaker','clerk'] as const)assert.ok(conversationTopics(entity,save).some(topic=>topic.id==='share-findings'))
})

test('conversation replies paginate without dropping text',()=>{
 const chinese='刚转生的人需要先辨认眼前发生的事。'.repeat(12),english='A newly transferred person needs time to understand what is happening before another decision appears. '.repeat(8)
 const zhPages=conversationPages(chinese,'zh'),enPages=conversationPages(english,'en')
 assert.ok(zhPages.length>1)
 assert.ok(enPages.length>1)
 assert.ok(zhPages.every(page=>page.length<=64))
 assert.ok(enPages.every(page=>page.length<=180))
 assert.equal(zhPages.join(''),chinese)
 assert.equal(enPages.join(''),english)
})

test('the reusable shell keeps map, backpack and menu as separate top-level tools',async()=>{
 const [main,shell]=await Promise.all([readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),readFile(new URL('../src/experience-shell.tsx',import.meta.url),'utf8')])
 for(const panel of ['map','backpack','menu'])assert.match(main,new RegExp(`setDialog\\('${panel}'\\)`))
 assert.match(main,/conversationPhase/)
 assert.match(main,/等待回应/)
 assert.match(main,/setTimeout\(\(\)=>setConversationPhase\('choices'\),900\)/)
 assert.match(main,/talkTopics\.slice\(0,2\)/)
 assert.match(shell,/YOU ARE HERE/)
 assert.match(shell,/CURRENT OBJECTIVE/)
 assert.match(shell,/CURRENT SAVE/)
 assert.match(shell,/route\.slice\(1\)/)
 assert.deepEqual(mapRoute('hall','home',new Set(['home','hall'])),['hall','home'])
 assert.deepEqual(mapRoute('service','home',new Set(['home','hall','service'])),['service','hall','home'])
})
