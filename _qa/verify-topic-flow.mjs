import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import {initialHead,resolveAction} from '../src/journey.ts'
import {entities} from '../src/world.ts'
const root='_qa/topic-flow-20260924';await mkdir(root,{recursive:true})
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
 await page.keyboard.press('e')
 const labels=['How long since your transfer?','Why did you stop checking?','Can someone else remembering replace your memory?']
 for(const [i,label] of labels.entries()){
  await page.getByRole('button',{name:label}).click();await page.locator('.mm-conversation[data-phase="reply"]').waitFor()
  for(let p=0;p<10;p++){const next=page.locator('.mm-conversation-continue');if(await next.count())await next.click();else break}
  await page.locator('.mm-conversation-options').waitFor();assert.equal(await page.getByRole('button',{name:label}).count(),0)
  await page.screenshot({path:`${root}/platform-layout-round-${i+1}-${width}.png`})
 }
 await page.reload();await page.locator('.mm-loading').waitFor({state:'detached'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'});await page.keyboard.press('e')
 for(const label of labels)assert.equal(await page.getByRole('button',{name:label}).count(),0)
 await page.locator('.mm-conversation-history summary').click();assert.ok((await page.locator('.mm-conversation-history').innerText()).includes(labels[0]));await page.screenshot({path:`${root}/platform-layout-history-${width}.png`})
 assert.deepEqual(errors,[]);results.push({width,height,errors,threeRounds:true,reloadNoRepeat:true,historyReadable:true,seededIntroducedCharacter:true})
 await context.close()
}}finally{await browser.close()}
await writeFile(`${root}/results.json`,JSON.stringify(results,null,2))
