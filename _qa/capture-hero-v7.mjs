import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {resolve} from 'node:path'
import {mkdir} from 'node:fs/promises'

const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
await mkdir(resolve('_qa/hero-v7'),{recursive:true})
try{
 for(const [width,height] of [[390,844],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(String(error)))
  await page.goto('http://127.0.0.1:5212/?lang=zh',{waitUntil:'domcontentloaded'})
  await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
  await page.locator('.mm-loading').waitFor({state:'detached'})
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(1000);await page.keyboard.up('ArrowUp')
  await page.screenshot({path:resolve(`_qa/hero-v7/${width}x${height}-room-walls.png`),fullPage:true})
  for(const [direction,key] of [['left','ArrowLeft'],['right','ArrowRight'],['up','ArrowUp'],['down','ArrowDown']]){
   await page.keyboard.down(key)
   for(let frame=1;frame<=4;frame++){await page.waitForTimeout(95);await page.screenshot({path:resolve(`_qa/hero-v7/${width}x${height}-${direction}-${frame}.png`),fullPage:true})}
   await page.keyboard.up(key)
  }
  assert.equal(await page.locator('body').evaluate(node=>node.scrollWidth),width)
  assert.deepEqual(errors,[])
  await context.close()
 }
}finally{await browser.close()}
