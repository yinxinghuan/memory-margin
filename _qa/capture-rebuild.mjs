import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'

const base=process.env.QA_URL||'http://127.0.0.1:5213/'
const root=resolve('_qa/rebuild-20260924/baseline')
await mkdir(root,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
const results=[]
try{
 for(const [width,height] of [[390,844],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(String(error)))
  await page.addInitScript(()=>{
   window.__releaseAudioPlays=[]
   const original=HTMLMediaElement.prototype.play
   HTMLMediaElement.prototype.play=function(){window.__releaseAudioPlays.push(this.src);return original.call(this)}
  })
  await page.goto(`${base}?lang=zh&release_qa=1`,{waitUntil:'domcontentloaded'})
  await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
  await page.locator('.mm-loading').waitFor({state:'detached'})
  assert.equal(await page.title(),'记忆余量 · Memory Margin')
  assert.equal(await page.locator('body').evaluate(node=>node.scrollWidth),width)
  await page.screenshot({path:resolve(root,`platform-layout-idle-${width}x${height}.png`),fullPage:true})
  if(await page.getByRole('button',{name:'开始探索'}).count())await page.getByRole('button',{name:'开始探索'}).click()
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(500);await page.keyboard.up('ArrowUp');await page.waitForTimeout(500)
  const audioPlays=await page.evaluate(()=>window.__releaseAudioPlays)
  assert.ok(audioPlays.some(url=>url.endsWith('/audio/memory-margin-ambient.mp3')),'first gesture should start the ambient track')
  assert.ok(audioPlays.some(url=>url.includes('/audio/memory-footstep-')),'actual travel should trigger a distance-based footstep')
  for(const path of ['audio/memory-margin-ambient.mp3','audio/memory-fracture.mp3','audio/memory-footstep-left.mp3','audio/memory-footstep-right.mp3','poster.png']){
   const response=await page.request.get(new URL(path,base).href)
   assert.equal(response.status(),200,`${path} should be published`)
   assert.ok((await response.body()).length>1000,`${path} should be non-empty`)
  }
  const sound=page.locator('.mm-sound')
  assert.equal(await sound.getAttribute('aria-pressed'),'true')
  await sound.click();assert.equal(await sound.getAttribute('aria-pressed'),'false')
  await sound.click();assert.equal(await sound.getAttribute('aria-pressed'),'true')
  assert.deepEqual(errors,[])
  await page.screenshot({path:resolve(root,`platform-layout-moving-${width}x${height}.png`),fullPage:true})
  results.push({width,height,audioPlays,errors,scrollWidth:await page.locator('body').evaluate(node=>node.scrollWidth)})
  await context.close()
 }
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1})
 const page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(String(error)))
 await page.goto(`${base}?lang=zh&external_release_qa=1`,{waitUntil:'domcontentloaded'})
 await page.locator('.mm-loading').waitFor({state:'detached'})
 await page.waitForTimeout(2500)
 assert.equal(await page.locator('script[src="https://images.aiwaves.tech/alteru/guest-shell.js"]').count(),1)
 await page.screenshot({path:resolve(root,'external-guest-390x844.png'),fullPage:true})
 results.push({externalGuestScript:true,banner:await page.locator('#alteru-guest-banner').count(),errors})
 await context.close()
}finally{await browser.close()}
await writeFile(resolve(root,'release-results.json'),JSON.stringify({capturedAt:new Date().toISOString(),results},null,2)+'\n')
