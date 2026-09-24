import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
const base=process.env.MM_QA_URL||'http://127.0.0.1:5213/',root=process.env.MM_QA_OUT||'_qa/rebuild-20260924/release-local';await mkdir(root,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),results=[]
try{for(const [width,height] of [[390,844],[320,568]]){
 const page=await browser.newPage({viewport:{width,height},locale:'en-US'}),errors=[];page.on('pageerror',e=>errors.push(String(e)))
 await page.goto(base+'?debug=1',{waitUntil:'domcontentloaded'});await page.locator('.mm-loading').waitFor({state:'detached',timeout:60000});assert.equal(await page.locator('html').getAttribute('data-release'),'memory-skill-validation-20260924-r1')
 await page.screenshot({path:`${root}/external-guest-${width}.png`});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 await page.getByRole('button',{name:'Start exploring',exact:true}).click()
 const pos=()=>page.evaluate(()=>{const p=document.querySelector('#rpg').__rpgClient.getCurrentPlayer();return{x:p.x(),y:p.y()}}),before=await pos(),b=await page.locator('.mm-stick').boundingBox()
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+24,b.y+b.height/2);await page.waitForTimeout(450);await page.mouse.up();const after=await pos();assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>3)
 await page.waitForTimeout(250);const stopped=await pos();await page.waitForTimeout(250);assert.deepEqual(await pos(),stopped)
 for(const name of ['Map','Backpack','Menu']){await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'Back to map',exact:true}).click()}
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${root}/platform-layout-${width}.png`});assert.deepEqual(errors,[]);results.push({width,height,errors,joystickMovesAndStops:true,headerPanels:true,release:'memory-skill-validation-20260924-r1'});await page.close()
}}finally{await browser.close()}
await writeFile(`${root}/results.json`,JSON.stringify({base,input:'normal pointer input; no force click or save seeding; not native iPhone',results},null,2))
