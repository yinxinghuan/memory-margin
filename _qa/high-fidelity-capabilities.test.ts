import test from 'node:test'
import assert from 'node:assert/strict'
import {indexedDB} from 'fake-indexeddb'
import {advanceFootsteps,emptyFootstepState} from '../src/distance-footsteps'
import {JourneyStore} from '../src/storage'

test('footsteps follow accumulated collision-resolved distance and alternate feet',()=>{
 const heard:Array<'left'|'right'>=[]
 let state=emptyFootstepState()
 state=advanceFootsteps(state,9,24,foot=>heard.push(foot))
 state=advanceFootsteps(state,14,24,foot=>heard.push(foot))
 assert.equal(heard.length,0)
 state=advanceFootsteps(state,2,24,foot=>heard.push(foot))
 state=advanceFootsteps(state,48,24,foot=>heard.push(foot))
 assert.deepEqual(heard,['left','right','left'])
 assert.equal(state.distance,1)
})

test('conversation exchanges survive close and reopen and duplicate writes are idempotent',async()=>{
 Object.assign(globalThis,{indexedDB})
 const name=`memory-margin-history-${crypto.randomUUID()}`
 let store=await JourneyStore.open(name)
 const head=await store.load('zh')
 const next=await store.appendConversationExchange(head.version,'neighbor','你转生多久了？','三个月。','exchange-1')
 assert.equal(next.conversationHistory.turns.length,2)
 await store.appendConversationExchange(head.version,'neighbor','你转生多久了？','三个月。','exchange-1')
 store.close()
 store=await JourneyStore.open(name)
 const resumed=await store.load('zh')
 assert.deepEqual(resumed.conversationHistory.turns.map(turn=>turn.id),['exchange-1:player','exchange-1:character'])
 store.close()
})
