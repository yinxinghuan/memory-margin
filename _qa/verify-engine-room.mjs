import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
const compact=process.env.MM_QA_COMPACT==='1'
const root=(process.env.MM_QA_ROOT||'_qa/rebuild-20260924/engine-route')+(compact?'-320':'');await mkdir(root,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
const errors=[],evidence=[]
try{const context=await browser.newContext({viewport:compact?{width:320,height:568}:{width:390,height:844}}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)))
 await page.goto('http://127.0.0.1:5213/?lang=en&debug=1&hero_review=1',{waitUntil:'domcontentloaded'});await page.locator('.mm-loading').waitFor({state:'detached'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 await page.getByRole('button',{name:'Start exploring',exact:true}).click()
 for(const [door,next] of [['home-door','hall'],['service-door','service'],['service-exit','hall'],['home-return','home']]){
  // On small screens, walk the camera toward an offscreen exit before clicking it.
  for(let step=0;step<100;step++){
   const direction=await page.evaluate(id=>{const t=document.querySelector(`.mm-hotspot[data-entity="${id}"]`).getBoundingClientRect(),r=document.querySelector('.mm-map').getBoundingClientRect();const x=t.left+t.width/2,y=t.top+t.height/2;return y<r.top+6?'ArrowUp':y>r.bottom-6?'ArrowDown':x<r.left+6?'ArrowLeft':x>r.right-6?'ArrowRight':null},door)
   if(!direction)break
   await page.keyboard.down(direction);await page.waitForTimeout(100);await page.keyboard.up(direction)
  }
  if(compact)await page.locator(`.mm-hotspot[data-entity="${door}"]`).dispatchEvent('click')
  else await page.locator(`.mm-hotspot[data-entity="${door}"]`).click({force:true})
  await page.waitForFunction(id=>document.querySelector(`.mm-hotspot[data-entity="${id}"]`)?.classList.contains('mm-hotspot--near'),door,{timeout:15000})
  await page.keyboard.press('e');await page.waitForFunction(scene=>document.querySelector('.mm-map')?.getAttribute('data-scene')===scene,next);await page.locator('.mm-loading').waitFor({state:'detached'});await page.waitForTimeout(800)
  const report=await page.evaluate(()=>{const client=document.querySelector('#rpg').__rpgClient,room=client.activeRoom(),events=client.sceneMap.events();return{room:room.name,events:Object.keys(events).length,domActors:document.querySelectorAll('.mm-person-sprite').length,domScenery:document.querySelectorAll('.mm-architecture,.mm-prop').length,reveal:(()=>{const found=[];const walk=n=>{if(n.label==='mm-local-foreground-reveal')found.push({x:n.x,y:n.y,global:n.getGlobalPosition(),bounds:n.getBounds(),parentScale:{x:n.parent.scale.x,y:n.parent.scale.y}});for(const c of n.children??[])walk(c)};walk(client.canvasApp.stage);return found})(),canvas:document.querySelectorAll('#rpg canvas').length}})
  assert.ok(report.events>5);assert.equal(report.domActors,0);assert.equal(report.domScenery,0);assert.equal(report.canvas,1)
  if(next==='service')await page.evaluate(()=>{window.__wallDebug=[];const walk=n=>{if(n.texture?.source?.label?.includes('/rpg-layers/service-front-'))window.__wallDebug.push({label:n.texture.source.label,mask:!!n.mask,maskVisible:n.mask?.visible,options:n._maskOptions.inverse,position:n.mask?.position?{x:n.mask.x,y:n.mask.y}:null});for(const c of n.children??[])walk(c)};walk(document.querySelector('#rpg').__rpgClient.canvasApp.stage)});
  evidence.push({door,next,...report,wallDebug:next==='service'?await page.evaluate(()=>window.__wallDebug):undefined});await page.screenshot({path:`${root}/platform-layout-${door}-to-${next}.png`})
  if(next==='service'||next==='home'){
   const key=next==='service'?'ArrowUp':'ArrowDown';await page.keyboard.down(key);await page.waitForTimeout(1050);await page.keyboard.up(key);await page.waitForTimeout(150)
   await page.screenshot({path:`${root}/platform-layout-${next}-door-clear.png`})
  }
 }
 assert.deepEqual(errors,[]);await writeFile(`${root}/results.json`,JSON.stringify({errors,input:compact?'keyboard camera approach + synthetic hotspot dispatch for small-screen visual states':'forced pointer hotspot click + keyboard activation; not normal touch hit-testing',evidence},null,2));await context.close()
}finally{await browser.close()}
