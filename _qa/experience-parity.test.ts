import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {applyAction,initialStory} from '../src/story'
import {conversationTopics,freeConversationReply} from '../src/conversation'
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

test('the reusable shell keeps map, backpack and menu as separate top-level tools',async()=>{
 const [main,shell]=await Promise.all([readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),readFile(new URL('../src/experience-shell.tsx',import.meta.url),'utf8')])
 for(const panel of ['map','backpack','menu'])assert.match(main,new RegExp(`setDialog\\('${panel}'\\)`))
 assert.match(shell,/YOU ARE HERE/)
 assert.match(shell,/CURRENT OBJECTIVE/)
 assert.match(shell,/CURRENT SAVE/)
 assert.match(shell,/route\.slice\(1\)/)
 assert.deepEqual(mapRoute('hall','home',new Set(['home','hall'])),['hall','home'])
 assert.deepEqual(mapRoute('service','home',new Set(['home','hall','service'])),['service','hall','home'])
})
