import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {resolve} from 'node:path'

const root=resolve('_qa')
const qaUrl=process.env.QA_URL??'http://127.0.0.1:5212/'

async function waitPrimary(page,target,verb){
 await page.waitForFunction(([wantedTarget,wantedVerb])=>{
  const button=document.querySelector('.mm-primary')
  return button&&!button.hasAttribute('disabled')&&button.textContent?.includes(wantedTarget)&&button.textContent?.includes(wantedVerb)
 },[target,verb],{timeout:12000})
}

async function approach(page,label,verb='查看'){
 await page.getByRole('button',{name:label,exact:true}).click()
 await waitPrimary(page,label,verb)
}

async function capture(browser,width,height){
 const suffix=`${width}x${height}`
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1})
 await page.goto(`${qaUrl}?qa=terminal-theme-v1`,{waitUntil:'networkidle'})
 await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 await page.locator('.mm-loading').waitFor({state:'detached'})
 assert.equal(await page.locator('[data-spatial-ui-theme="05-terminal"]').count(),1)

 await page.screenshot({path:resolve(root,`platform-layout-terminal-explore-${suffix}.png`),fullPage:true})
 await approach(page,'语音盒')
 assert.equal(await page.evaluate(()=>window.scrollY),0,'approaching a hotspot must not scroll the page')
 await page.screenshot({path:resolve(root,`platform-layout-terminal-near-${suffix}.png`),fullPage:true})
 await page.locator('.mm-primary').click()
 await page.locator('.mm-interaction-layer').waitFor()
 assert.equal(await page.evaluate(()=>window.scrollY),0,'opening interaction content must not scroll the page')
 await page.screenshot({path:resolve(root,`platform-layout-terminal-open-${suffix}.png`),fullPage:true})

 await page.locator('.mm-actions button').filter({hasText:'播放这段语音'}).click()
 await page.locator('.mm-loading').waitFor({state:'visible'})
 await page.locator('.mm-loading').waitFor({state:'detached'})
 await page.locator('.mm-primary').click()
 await page.locator('.mm-interaction-layer').waitFor({state:'detached'})
 await approach(page,'迁入回执')
 await page.locator('.mm-primary').click()
 await page.locator('.mm-actions button').filter({hasText:'读回执'}).click()
 await page.locator('.mm-loading').waitFor({state:'visible'})
 await page.locator('.mm-loading').waitFor({state:'detached'})
 await page.locator('.mm-read-more').filter({hasText:'放大回执'}).waitFor()
 await page.locator('.mm-read-more').filter({hasText:'放大回执'}).click()
 await page.locator('.mm-zoom').waitFor()
 await page.screenshot({path:resolve(root,`platform-layout-terminal-zoom-${suffix}.png`),fullPage:true})

 await page.getByRole('button',{name:'关闭放大资料'}).click()
 await page.getByRole('button',{name:'回到地图'}).click()
 await page.getByRole('button',{name:'背包',exact:true}).click()
 await page.locator('.mm-backpack').waitFor()
 await page.getByRole('button',{name:'线索',exact:true}).click()
 await page.screenshot({path:resolve(root,`platform-layout-terminal-records-${suffix}.png`),fullPage:true})
 await page.close()
}

const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
try{
 await capture(browser,390,844)
 await capture(browser,320,568)
}finally{
 await browser.close()
}
