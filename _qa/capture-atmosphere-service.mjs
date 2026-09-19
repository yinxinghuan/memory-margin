import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {resolve} from 'node:path'

const root=resolve('_qa')

async function enter(page,entity,scene){
 await page.locator(`[data-entity="${entity}"].mm-hotspot`).evaluate(node=>node.click())
 await page.waitForFunction(id=>document.querySelector(`.mm-hotspot[data-entity="${id}"]`)?.classList.contains('mm-hotspot--near'),entity)
 await page.locator('.mm-primary').click()
 await page.locator(`.mm-map[data-scene="${scene}"]`).waitFor()
 await page.waitForTimeout(160)
}

async function capture(browser,width,height){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1})
 const page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(String(error)))
 await page.goto('http://127.0.0.1:5212/?atmosphere=props&qa=service-atmosphere-v2',{waitUntil:'networkidle'})
 await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 await page.locator('.mm-loading').waitFor({state:'detached'})
 await enter(page,'home-door','hall')
 await enter(page,'service-door','service')
 assert.equal(await page.locator('[data-ambient-piece]').count(),3)
 assert.deepEqual(errors,[])
 await page.screenshot({path:resolve(root,`platform-layout-atmosphere-service-${width}x${height}.png`),fullPage:true})
 for(const entity of ['ledger','choice-desk','terms-card']){
  await page.locator(`[data-entity="${entity}"].mm-hotspot`).evaluate(node=>node.click())
  await page.waitForFunction(id=>document.querySelector(`.mm-hotspot[data-entity="${id}"]`)?.classList.contains('mm-hotspot--near'),entity)
 }
 await context.close()
}

const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
try{
 await capture(browser,390,844)
 await capture(browser,320,568)
}finally{
 await browser.close()
}
