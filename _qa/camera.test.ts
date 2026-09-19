import test from 'node:test'
import assert from 'node:assert/strict'
import {mapCamera} from '../src/camera'

test('map camera advances from overview and keeps the player in frame',()=>{
 const tall=mapCamera({width:390,height:635},{x:192,y:410})
 assert.equal(tall.scale,1.21875)
 assert.ok(tall.width>390)
 assert.ok((410+15)*tall.scale+tall.y>0)
 assert.ok((410+15)*tall.scale+tall.y<635)
 const short=mapCamera({width:320,height:364},{x:192,y:410})
 assert.equal(short.scale,1.05)
 assert.ok(short.y<0)
 assert.ok(176*short.scale+short.y>-10,'opening tables remain at the camera edge')
})
