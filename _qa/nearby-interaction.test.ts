import test from 'node:test'
import assert from 'node:assert/strict'
import {primaryInteractionIntent,stableNearby} from '../src/nearby-interaction'

const targets=[
 {id:'left',approach:{x:10,y:10}},
 {id:'right',approach:{x:18,y:10}},
]

test('clicked nearby target wins and focus does not flicker within the hysteresis band',()=>{
 const near=()=>true
 assert.equal(stableNearby(targets,{x:14,y:10},near,undefined,'right')?.id,'right')
 assert.equal(stableNearby(targets,{x:13,y:10},near,'right')?.id,'right')
 assert.equal(stableNearby(targets,{x:9,y:10},near,'right')?.id,'left')
})

test('interaction content can only open from the persistent primary action',()=>{
 assert.equal(primaryInteractionIntent(undefined,false),'inactive')
 assert.equal(primaryInteractionIntent('record',false),'open-panel')
 assert.equal(primaryInteractionIntent('person',false),'open-panel')
 assert.equal(primaryInteractionIntent('door',false),'enter-door')
 assert.equal(primaryInteractionIntent('record',true),'close-panel')
})
