import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {resolve} from 'node:path'

const root=resolve('_qa')
async function capture(browser,width,height,area){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1})
 const page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(String(error)))
 await page.goto(`http://127.0.0.1:5212/?large_scene=1&area=${area}&lang=zh`,{waitUntil:'networkidle'})
 await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 await page.locator('.mm-loading').waitFor({state:'detached'})
 assert.equal(await page.locator('[data-large-piece]').count(),15)
 assert.equal(await page.locator('[data-large-detail]').count(),12)
 assert.equal(await page.locator('[data-detail-source="generated"]').count(),12)
 assert.equal(await page.locator('[data-detail-pack-ready="true"]').count(),1)
 assert.equal(await page.locator('#rpg canvas').count(),1)
 assert.deepEqual(errors,[])
 await page.screenshot({path:resolve(root,`platform-layout-large-scene-${area}-${width}x${height}.png`),fullPage:true})
 await context.close()
}
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
try{
 await capture(browser,390,844,'south')
 await capture(browser,390,844,'west')
 await capture(browser,390,844,'east')
 await capture(browser,390,844,'north')
 await capture(browser,320,568,'center')
}finally{await browser.close()}
