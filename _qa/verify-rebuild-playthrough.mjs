import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
const source=await readFile('src/main.tsx','utf8'),labels=Object.fromEntries([...source.matchAll(/'([a-z-]+)':\['[^']*','([^']*)'\]/g)].map(m=>[m[1],m[2]]))
const alternate=process.env.MM_QA_BRANCH==='keep-stop';
const root=alternate?'_qa/rebuild-20260924/playthrough-keep-stop':'_qa/rebuild-20260924/playthrough';await mkdir(root,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],actions=[]
page.on('pageerror',e=>errors.push(String(e)))
const readHead=()=>page.evaluate(async()=>{const r=indexedDB.open('alteru:b198e25d-5781-48c3-930a-143ed23a92b4:memory-margin-journey-v1',1);return await new Promise((resolve,reject)=>{r.onsuccess=()=>{const tx=r.result.transaction('heads','readonly'),get=tx.objectStore('heads').get('active');get.onsuccess=()=>resolve(get.result);tx.oncomplete=()=>r.result.close();get.onerror=()=>reject(get.error)}})})
try{
 await page.goto('http://127.0.0.1:5213/?lang=en');await page.locator('.mm-loading').waitFor({state:'detached'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'});await page.getByRole('button',{name:'Start exploring',exact:true}).click()
 for(const [entity,action] of [['voice-box','listen-voice'],['receipt','read-receipt'],['home-door','to-hall'],['neighbor','talk-neighbor'],['caretaker','talk-caretaker'],['seal','read-seal'],['service-door','to-service'],['clerk','talk-clerk'],['ledger','read-ledger'],['choice-desk','compare-records'],['choice-desk',alternate?'choose-keep':'choose-lend'],['service-exit','service-to-hall'],['home-return','to-home'],['voice-box','revisit-voice'],['voice-box',alternate?'try-save-morning':'save-morning'],['home-door','to-hall'],['neighbor','ask-neighbor-preview'],['service-door','to-service'],['preview-screen','read-preview-log'],['clerk','confront-clerk-preview'],['preview-screen',alternate?'stop-preview':'trace-preview'],['service-exit','service-to-hall'],['neighbor','debrief-neighbor']]){
  const close=page.getByRole('button',{name:'Back to map',exact:true});if(await close.count())await close.click()
  await page.locator(`.mm-hotspot[data-entity="${entity}"]`).dispatchEvent('click')
  await page.waitForFunction(id=>document.querySelector(`.mm-hotspot[data-entity="${id}"]`)?.classList.contains('mm-hotspot--near'),entity,{timeout:18000})
  const before=await readHead();await page.locator('.mm-primary').click()
  if(!['home-door','home-return','service-door','service-exit'].includes(entity)){
   await page.locator('.mm-interaction-layer').waitFor()
   if(action==='compare-records'){await page.getByRole('button',{name:'Queued for lending',exact:true}).click();await page.getByRole('button',{name:'Confirm comparison'}).click()}
   else {assert.ok(labels[action],action);await page.getByRole('button',{name:labels[action]}).click()}
   if(['choose-lend','choose-keep','trace-preview','stop-preview'].includes(action))await page.getByRole('button',{name:'Confirm this choice'}).click()
  }
  let after;for(let i=0;i<50;i++){after=await readHead();if(after.version>before.version)break;await page.waitForTimeout(100)}
  assert.ok(after.version>before.version,`Action not committed: ${entity}/${action}`)
  await page.locator('.mm-loading').waitFor({state:'detached'});actions.push({entity,action,version:after.version,scene:after.scene});console.log(action,after.version)
 }
 const close=page.getByRole('button',{name:'Back to map',exact:true});if(await close.count())await close.click()
 await page.locator('.mm-objective--complete').click();await page.screenshot({path:`root/ending.png`.replace('root',root)})
 await page.reload();await page.locator('.mm-loading').waitFor({state:'detached'});const final=(await readHead()).save.facts;assert.ok(final.neighborDebriefed);assert.ok(alternate?final.kept&&final.previewStopped:final.lent&&final.previewTraced);assert.deepEqual(errors,[])
 await writeFile(`${root}/results.json`,JSON.stringify({input:'synthetic hotspot selection, actual engine walking and UI actions; no progress seeding',actions,errors,reloadRestored:true},null,2))
}catch(error){await page.screenshot({path:`${root}/failure.png`});await writeFile(`${root}/failure.json`,JSON.stringify({actions,error:String(error),errors},null,2));throw error}finally{await browser.close()}
