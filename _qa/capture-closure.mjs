import {chromium} from 'playwright'
import {resolve} from 'node:path'

const base=process.env.QA_URL||'http://127.0.0.1:5215/'
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
try{
 for(const [width,height] of [[390,844],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1}),page=await context.newPage()
  await page.goto(`${base}?qa=closure`,{waitUntil:'networkidle'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'});await page.locator('.mm-loading').waitFor({state:'detached'})
  await page.evaluate(async()=>{
   const journey=await import('/src/journey.ts'),world=await import('/src/world.ts')
   const step=(head,entity,action)=>journey.resolveAction(head,{id:crypto.randomUUID(),version:head.version,scene:head.scene,entity,action,position:world.entities[entity].approach}).head
   let head=journey.initialHead('zh')
   for(const [entity,action] of [['voice-box','listen-voice'],['receipt','read-receipt'],['home-door','to-hall'],['neighbor','talk-neighbor'],['caretaker','talk-caretaker'],['seal','read-seal'],['service-door','to-service'],['clerk','talk-clerk'],['ledger','read-ledger'],['choice-desk','compare-records'],['choice-desk','choose-lend'],['service-exit','service-to-hall'],['home-return','to-home'],['voice-box','revisit-voice'],['voice-box','save-morning'],['home-door','to-hall'],['neighbor','ask-neighbor-preview'],['service-door','to-service'],['preview-screen','read-preview-log'],['clerk','confront-clerk-preview'],['preview-screen','trace-preview'],['service-exit','service-to-hall'],['neighbor','debrief-neighbor']])head=step(head,entity,action)
   const request=indexedDB.open('alteru:b198e25d-5781-48c3-930a-143ed23a92b4:memory-margin-journey-v1',1)
   await new Promise((accept,reject)=>{request.onerror=()=>reject(request.error);request.onsuccess=()=>{const tx=request.result.transaction('heads','readwrite');tx.objectStore('heads').put(head,'active');tx.oncomplete=()=>{request.result.close();accept()};tx.onerror=()=>reject(tx.error)}})
  })
  await page.reload({waitUntil:'networkidle'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'});await page.locator('.mm-loading').waitFor({state:'detached'});await page.locator('.mm-objective--complete').click();await page.locator('.mm-result-signal').waitFor();await page.screenshot({path:resolve(`_qa/platform-layout-chapter-closure-${width}x${height}.png`),fullPage:true})
  await context.close()
 }
}finally{await browser.close()}
