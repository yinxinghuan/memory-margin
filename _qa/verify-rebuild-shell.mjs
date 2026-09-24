import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import {initialHead,resolveAction} from '../src/journey.ts'
import {entities} from '../src/world.ts'
const root='_qa/rebuild-20260924/shell';await mkdir(root,{recursive:true})
let head=initialHead('en')
for(const [entity,action] of [['voice-box','listen-voice'],['receipt','read-receipt'],['home-door','to-hall'],['neighbor','talk-neighbor'],['caretaker','talk-caretaker'],['seal','read-seal'],['service-door','to-service'],['clerk','talk-clerk'],['ledger','read-ledger'],['choice-desk','compare-records'],['choice-desk','choose-lend'],['service-exit','service-to-hall'],['home-return','to-home'],['voice-box','revisit-voice'],['voice-box','save-morning'],['home-door','to-hall'],['neighbor','ask-neighbor-preview'],['service-door','to-service'],['preview-screen','read-preview-log'],['clerk','confront-clerk-preview'],['preview-screen','trace-preview'],['service-exit','service-to-hall'],['neighbor','debrief-neighbor']])head=resolveAction(head,{id:crypto.randomUUID(),version:head.version,scene:head.scene,entity,action,position:entities[entity].approach}).head
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),results=[]
try{for(const [width,height] of [[390,844],[320,568]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)))
 await page.goto('http://127.0.0.1:5213/?lang=en');await page.locator('.mm-loading').waitFor({state:'detached'})
 await page.evaluate(async head=>{const r=indexedDB.open('alteru:b198e25d-5781-48c3-930a-143ed23a92b4:memory-margin-journey-v1',1);await new Promise((resolve,reject)=>{r.onsuccess=()=>{const tx=r.result.transaction('heads','readwrite');tx.objectStore('heads').put(head,'active');tx.oncomplete=()=>{r.result.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)})},head)
 await page.reload();await page.locator('.mm-loading').waitFor({state:'detached'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 const shot=async name=>{await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.mm-backpack-thumb')].map(async node=>{const url=getComputedStyle(node).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];if(url){const image=new Image();image.src=url;await image.decode()}}))});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${root}/platform-layout-${name}-${width}x${height}.png`})}
 await page.locator('.mm-objective--complete').click();await page.locator('.mm-result-signal').waitFor();await shot('ending');await page.getByRole('button',{name:'Back to map',exact:true}).click()
 await page.getByRole('button',{name:'Map',exact:true}).click();await shot('map');await page.getByRole('button',{name:'Back to map',exact:true}).click()
 await page.getByRole('button',{name:'Backpack',exact:true}).click()
 for(const tab of ['Goal','Items','Clues','People']){await page.getByRole('button',{name:tab,exact:true}).click();await shot('bag-'+tab.toLowerCase())}
 assert.equal(await page.locator('.mm-backpack-thumb[data-kind="person"]').count(),3)
 await page.getByRole('button',{name:'Clues',exact:true}).click();await page.locator('.mm-backpack-entry').first().click();await shot('document')
 assert.deepEqual(errors,[]);results.push({width,height,errors,seededAuthoritativeEnding:true,overflow:false});await page.close()
}}finally{await browser.close()}
await writeFile(`${root}/results.json`,JSON.stringify(results,null,2))
