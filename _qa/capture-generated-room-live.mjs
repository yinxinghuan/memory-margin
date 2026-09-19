import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {resolve} from 'node:path'
import {writeFile} from 'node:fs/promises'

const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
const results=[]

try{
 for(const [width,height] of [[390,844],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1})
  const page=await context.newPage()
  const errors=[]
  page.on('pageerror',error=>errors.push(String(error)))

  const started=Date.now()
  await page.goto('http://127.0.0.1:5212/?generated_room=1&room_phase=live&reset_room_media=1&lang=zh',{waitUntil:'domcontentloaded'})
  await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
  await page.locator('[data-space-ready="true"]').waitFor()
  const interactiveMs=Date.now()-started
  const initialReady=Number(await page.locator('[data-room-ready-count]').getAttribute('data-room-ready-count'))
  assert.ok(initialReady<4,'a reset live room must expose its shell before all media is accepted')
  assert.equal(await page.locator('#rpg canvas').count(),1)

  await page.waitForFunction(()=>document.querySelector('[data-room-ready-count="4"]')!==null)
  const completeMs=Date.now()-started
  assert.equal(await page.locator('[data-audit-piece]').count(),4)
  assert.equal(await page.locator('[data-audit-shell-piece]').count(),0)
  assert.equal(await page.locator('[data-room-failed-count="0"]').count(),1)
  assert.doesNotMatch(await page.locator('body').innerText(),/碰撞|空间规则|后台|任务编号|request.?id|task.?id|384×512|用户房间生成测速/i)
  assert.deepEqual(errors,[])
  await page.screenshot({path:resolve(`_qa/platform-layout-generated-audit-live-${width}x${height}.png`),fullPage:true})

  const refreshed=Date.now()
  await page.goto('http://127.0.0.1:5212/?generated_room=1&room_phase=live&lang=zh',{waitUntil:'domcontentloaded'})
  await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
  await page.locator('[data-space-ready="true"]').waitFor()
  assert.equal(await page.locator('[data-room-ready-count="4"]').count(),1)
  assert.equal(await page.locator('[data-audit-shell-piece]').count(),0)
  const refreshRestoreMs=Date.now()-refreshed
  assert.deepEqual(errors,[])

  results.push({width,height,interactiveMs,initialReady,completeMs,refreshRestoreMs,errors})
  await context.close()
 }
}finally{
 await browser.close()
}

await writeFile(resolve('_qa/generated-room-live-results.json'),JSON.stringify({capturedAt:new Date().toISOString(),results},null,2)+'\n')
