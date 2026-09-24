import {chromium} from 'playwright'
import {writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
const errors=[]
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(String(e)))
 await page.goto('http://127.0.0.1:5213/?debug=1&lang=en');await page.locator('.mm-loading').waitFor({state:'detached'});await page.getByRole('button',{name:'Start exploring',exact:true}).click()
 await page.evaluate(()=>{window.__soak={frames:[],start:performance.now(),last:0};function tick(now){const s=window.__soak;if(s.last)s.frames.push({at:now-s.start,dt:now-s.last});s.last=now;if(now-s.start<65000)requestAnimationFrame(tick)}requestAnimationFrame(tick)})
 const samples=[]
 for(let i=0;i<12;i++){
  await page.keyboard.down(i%2?'ArrowUp':'ArrowDown');await page.waitForTimeout(2500);await page.keyboard.up(i%2?'ArrowUp':'ArrowDown')
  await page.keyboard.down(i%2?'ArrowRight':'ArrowLeft');await page.waitForTimeout(2500);await page.keyboard.up(i%2?'ArrowRight':'ArrowLeft')
  samples.push(await page.evaluate(()=>{const e=document.querySelector('#rpg').__rpgClient;let nodes=0,masks=0;const walk=n=>{nodes++;if(n.label==='mm-local-foreground-reveal')masks++;for(const c of n.children??[])walk(c)};walk(e.canvasApp.stage);return{nodes,masks,events:Object.keys(e.sceneMap.events()).length,heap:performance.memory?.usedJSHeapSize,position:{x:e.getCurrentPlayer().x(),y:e.getCurrentPlayer().y()}}}))
 }
 const frames=await page.evaluate(()=>window.__soak.frames),windows=[0,15000,30000,45000].map(start=>{const d=frames.filter(f=>f.at>=start&&f.at<start+15000).map(f=>f.dt).sort((a,b)=>a-b);return{start,p50:d[Math.floor(d.length*.5)],p95:d[Math.floor(d.length*.95)],over50ms:d.filter(v=>v>50).length,total:d.length}})
 assert.deepEqual(errors,[]);assert.ok(samples.every(s=>s.events===samples[0].events));assert.ok(samples.at(-1).nodes<=samples[0].nodes+5)
 await writeFile('_qa/rebuild-20260924/engine-soak.json',JSON.stringify({environment:'Desktop headless Chrome; not iPhone/AlterU performance evidence',duration:60,errors,windows,samples},null,2));await page.screenshot({path:'_qa/rebuild-20260924/engine-soak.png'})
}finally{await browser.close()}
