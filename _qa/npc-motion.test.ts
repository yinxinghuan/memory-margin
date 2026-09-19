import test from 'node:test'
import assert from 'node:assert/strict'
import {NpcResidentMotion} from '../src/npc-motion'

test('resident patrols inside its authored radius and rests at the ends',()=>{
 const resident=new NpcResidentMotion({home:{x:100,y:100},axis:'x',radius:12,speed:12,restSeconds:.2,attentionDistance:20})
 for(let i=0;i<200;i++)resident.update(.05,{x:300,y:300},false,false,()=>true)
 assert.ok(resident.state.position.x>=88&&resident.state.position.x<=112)
 assert.equal(resident.state.position.y,100)
 assert.ok(['left','right'].includes(resident.state.facing))
})

test('resident stops and faces an approaching or selected player',()=>{
 const resident=new NpcResidentMotion({home:{x:100,y:100},axis:'x',radius:12,speed:12,restSeconds:0,attentionDistance:30})
 resident.update(.1,{x:160,y:100},false,false,()=>true)
 resident.update(.1,{x:105,y:100},false,false,()=>true)
 assert.equal(resident.state.attending,true)
 assert.equal(resident.state.facing,'right')
 assert.equal(resident.state.frame,1)
 assert.equal(resident.state.moving,false)
 resident.update(.1,{x:100,y:60},false,true,()=>true)
 assert.equal(resident.state.facing,'up')
})
