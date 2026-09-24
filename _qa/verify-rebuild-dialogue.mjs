import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import {initialHead,resolveAction} from '../src/journey.ts'
import {entities} from '../src/world.ts'
const root='_qa/rebuild-20260924/dialogue';await mkdir(root,{recursive:true})
let head=initialHead('en')
for(const [entity,action] of [['voice-box','listen-voice'],['receipt','read-receipt'],['home-door','to-hall'],['neighbor','talk-neighbor']])head=resolveAction(head,{id:crypto.randomUUID(),version:head.version,scene:head.scene,entity,action,position:entities[entity].approach}).head
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
const results=[]
try{for(const [width,height] of [[390,844],[320,568]]){
 const context=await browser.newContext({viewport:{width,height},locale:'fr-FR'}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(String(e)))
 await page.goto('http://127.0.0.1:5213/',{waitUntil:'domcontentloaded'});await page.locator('.mm-loading').waitFor({state:'detached'})
 assert.equal(await page.locator('h1').innerText(),'Memory Margin')
 await page.evaluate(async head=>{const r=indexedDB.open('alteru:b198e25d-5781-48c3-930a-143ed23a92b4:memory-margin-journey-v1',1);await new Promise((resolve,reject)=>{r.onsuccess=()=>{const tx=r.result.transaction('heads','readwrite');tx.objectStore('heads').put(head,'active');tx.oncomplete=()=>{r.result.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)})},head)
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('.mm-loading').waitFor({state:'detached'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 await page.keyboard.press('e');await page.getByText('Say something else…',{exact:true}).click()
 const input=page.getByRole('textbox',{name:'Message'});await input.fill('How do you handle waking up here each morning?')
 let requestCount=0
 await page.route('**/aigram/api/game-chat',async route=>{requestCount++;await new Promise(r=>setTimeout(r,1300));await route.fulfill({json:{choices:[{message:{content:'I check the cup beside my bed. The warmth is small, but it is something I can name.'}}]}})})
 await page.getByRole('button',{name:'Talk',exact:true}).click()
 await page.locator('.mm-conversation-wait').waitFor();await page.screenshot({path:`${root}/platform-layout-waiting-${width}x${height}.png`})
 await page.getByText('I check the cup beside my bed.',{exact:false}).waitFor();await page.waitForTimeout(1000)
 assert.equal(requestCount,1);assert.equal(await page.locator('body').evaluate(n=>n.scrollWidth),width)
 await page.screenshot({path:`${root}/platform-layout-reply-${width}x${height}.png`})
 await page.getByText('Say something else…',{exact:true}).click();await input.fill('My message survives a connection failure.')
 await page.unroute('**/aigram/api/game-chat');await page.route('**/aigram/api/game-chat',route=>route.fulfill({status:503,body:'unavailable'}))
 await page.getByRole('button',{name:'Talk',exact:true}).click();await page.locator('.mm-chat-error').waitFor()
 assert.equal(await input.inputValue(),'My message survives a connection failure.')
 await page.screenshot({path:`${root}/platform-layout-retry-${width}x${height}.png`})
 await page.unroute('**/aigram/api/game-chat');await page.route('**/aigram/api/game-chat',async route=>{await new Promise(r=>setTimeout(r,1800));try{await route.fulfill({json:{choices:[{message:{content:'LATE RESPONSE MUST NOT APPEAR'}}]}})}catch{}})
 await page.getByRole('button',{name:'Talk',exact:true}).click();await page.locator('.mm-conversation-wait').waitFor()
 await page.getByRole('button',{name:'Map',exact:true}).click();await page.waitForTimeout(2100)
 assert.equal(await page.getByText('LATE RESPONSE MUST NOT APPEAR',{exact:false}).count(),0)
 assert.deepEqual(errors,[]);results.push({width,height,errors,requestCount,locale:'fr-FR => en',mockedTransport:true})
 await context.close()
}}finally{await browser.close()}
await writeFile(`${root}/results.json`,JSON.stringify(results,null,2))
