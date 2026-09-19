import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {resolve} from 'node:path'

const root=resolve('_qa')

async function waitPrimary(page,target,verb){
 await page.waitForFunction(([wantedTarget,wantedVerb])=>{
  const button=document.querySelector('.mm-primary')
  return button&&!button.hasAttribute('disabled')&&button.textContent?.includes(wantedTarget)&&button.textContent?.includes(wantedVerb)
 },[target,verb],{timeout:12000})
}

async function capture(browser,width,height){
 const suffix=`${width}x${height}`
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1})
 await page.goto('http://127.0.0.1:5212/?qa=interaction-v2',{waitUntil:'networkidle'})
 await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 await page.locator('.mm-loading').waitFor({state:'detached'})

 await page.getByRole('button',{name:'语音盒',exact:true}).click()
 await waitPrimary(page,'语音盒','查看')
 assert.equal(await page.locator('.mm-interaction-layer').count(),0,'approach must not open interaction content')
 await page.screenshot({path:resolve(root,`platform-layout-interaction-near-${suffix}.png`),fullPage:true})

 await page.locator('.mm-primary').click()
 await page.locator('.mm-interaction-layer').waitFor()
 assert.match(await page.locator('.mm-interaction-layer').innerText(),/语音盒/)
 await page.screenshot({path:resolve(root,`platform-layout-interaction-open-${suffix}.png`),fullPage:true})

 await page.locator('.mm-primary').click()
 await page.locator('.mm-interaction-layer').waitFor({state:'detached'})
 await page.getByRole('button',{name:'去公共走廊',exact:true}).click()
 await waitPrimary(page,'去公共走廊','前往')
 assert.equal(await page.locator('.mm-interaction-layer').count(),0,'door approach must keep the map in exploration state')
 await page.screenshot({path:resolve(root,`platform-layout-door-action-${suffix}.png`),fullPage:true})
 await page.close()
}

const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
try{
 await capture(browser,390,844)
 await capture(browser,320,568)
}finally{
 await browser.close()
}
