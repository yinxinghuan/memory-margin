import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {resolve} from 'node:path'

const root=resolve('_qa')
const executablePath='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function capture(browser,mode,width,height){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1})
 const page=await context.newPage()
 const errors=[]
 page.on('pageerror',error=>errors.push(String(error)))
 await page.goto(`http://127.0.0.1:5212/?atmosphere=${mode}&qa=atmosphere-v1`,{waitUntil:'networkidle'})
 await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 await page.locator('.mm-loading').waitFor({state:'detached'})
 if(mode==='props')assert.equal(await page.locator('[data-ambient-piece]').count(),4)
 if(mode==='baseline')assert.equal(await page.locator('[data-ambient-piece]').count(),0)
 assert.deepEqual(errors,[])
 await page.screenshot({path:resolve(root,`platform-layout-atmosphere-${mode}-${width}x${height}.png`),fullPage:true})
 await context.close()
}

const browser=await chromium.launch({headless:true,executablePath})
try{
 for(const mode of ['baseline','props','ground'])await capture(browser,mode,390,844)
 await capture(browser,'props',320,568)
}finally{
 await browser.close()
}
