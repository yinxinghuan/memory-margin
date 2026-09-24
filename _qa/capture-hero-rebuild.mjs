import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import {initialHead,resolveAction} from '../src/journey.ts'
import {entities} from '../src/world.ts'
const root='_qa/rebuild-20260924/hero-final';await mkdir(root,{recursive:true})
let head=initialHead('en');head=resolveAction(head,{id:crypto.randomUUID(),version:0,scene:'home',entity:'voice-box',action:'listen-voice',position:entities['voice-box'].approach}).head;head.position={x:185,y:132}
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
try{const context=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:root,size:{width:390,height:844}}}),page=await context.newPage();const errors=[],frames=[];page.on('pageerror',e=>errors.push(String(e)))
 await page.goto('http://127.0.0.1:5213/?debug=1',{waitUntil:'domcontentloaded'});await page.locator('.mm-loading').waitFor({state:'detached'})
 for(const [direction,key] of [['down','ArrowDown'],['left','ArrowLeft'],['right','ArrowRight'],['up','ArrowUp']]){
  head.position=direction==='left'?{x:250,y:132}:direction==='right'?{x:90,y:132}:{x:185,y:240}
  await page.evaluate(async head=>{const r=indexedDB.open('alteru:b198e25d-5781-48c3-930a-143ed23a92b4:memory-margin-journey-v1',1);await new Promise((resolve,reject)=>{r.onsuccess=()=>{const tx=r.result.transaction('heads','readwrite');tx.objectStore('heads').put(head,'active');tx.oncomplete=()=>{r.result.close();resolve()};tx.onerror=()=>reject(tx.error)}})},head)
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('.mm-loading').waitFor({state:'detached'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
  await page.keyboard.down(key)
  for(let frame=0;frame<12;frame++){await page.waitForTimeout(85);await page.screenshot({path:`${root}/platform-layout-${direction}-${frame}.png`});frames.push(await page.evaluate(([direction,frame])=>{const p=document.querySelector('#rpg').__rpgClient.getCurrentPlayer(),r=document.querySelector('.mm-world').getBoundingClientRect();return {direction,frame,pose:p.animationName(),x:r.left+(p.x()+4.5)*r.width/384,y:r.top+(p.y()+15)*r.height/512}},[direction,frame]))}
  await page.keyboard.up(key);await page.waitForTimeout(150);await page.screenshot({path:`${root}/platform-layout-${direction}-stand.png`})
 }
 await writeFile(`${root}/runtime.json`,JSON.stringify({errors,frames,candidateOnly:false,viewport:[390,844],framesPerDirection:12,source:'art/rebuild-20260924/hero-sheet.png'},null,2));await context.close()
}finally{await browser.close()}
