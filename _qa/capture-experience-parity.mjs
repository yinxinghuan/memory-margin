import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {resolve} from 'node:path'

const base=process.env.QA_URL||'http://127.0.0.1:5212/'
const root=resolve('_qa')
async function waitPrimary(page,target,verb){await page.waitForFunction(([a,b])=>{const n=document.querySelector('.mm-primary');return n&&!n.hasAttribute('disabled')&&n.textContent?.includes(a)&&n.textContent?.includes(b)},[target,verb],{timeout:12000})}
async function approach(page,target,verb='查看'){await page.getByRole('button',{name:target,exact:true}).click();await waitPrimary(page,target,verb);await page.locator('.mm-primary').click();await page.locator('.mm-interaction-layer').waitFor()}
async function run(width,height){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1}),page=await context.newPage()
 await page.goto(`${base}?qa=experience-parity-v1`,{waitUntil:'networkidle'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'});await page.locator('.mm-loading').waitFor({state:'detached'})
 for(const name of ['地图','背包','菜单'])assert.equal(await page.getByRole('button',{name,exact:true}).count(),1)
 await page.getByRole('button',{name:'地图',exact:true}).click();await page.locator('.mm-atlas').waitFor();assert.match(await page.locator('.mm-atlas').innerText(),/你在这里/);await page.screenshot({path:resolve(root,`platform-layout-real-map-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'回到地图'}).click()
 await page.getByRole('button',{name:'背包',exact:true}).click();await page.locator('.mm-backpack').waitFor();for(const name of ['目标','物品','线索','人物'])assert.equal(await page.getByRole('button',{name,exact:true}).count(),1);await page.screenshot({path:resolve(root,`platform-layout-backpack-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'回到地图'}).click()
 await page.getByRole('button',{name:'菜单',exact:true}).click();await page.locator('.mm-menu').waitFor();assert.match(await page.locator('.mm-menu').innerText(),/操作方法/);await page.getByRole('button',{name:'回到地图'}).click()
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(3400);await page.keyboard.up('ArrowUp');await waitPrimary(page,'去公共走廊','前往');await page.locator('.mm-primary').click();await page.locator('.mm-loading').waitFor({state:'visible'});await page.locator('.mm-loading').waitFor({state:'detached'})
 await page.getByRole('button',{name:'地图',exact:true}).click();await page.getByRole('button',{name:'转生居所',exact:true}).click();assert.match(await page.locator('.mm-atlas-route').innerText(),/左侧门/);assert.ok(await page.locator('.mm-atlas-route li').count()>=1);await page.screenshot({path:resolve(root,`platform-layout-real-route-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'回到地图'}).click()
 await approach(page,'等电梯的邻居','交谈');await page.locator('.mm-actions button').filter({hasText:'跟她说话'}).click();await page.locator('.mm-loading').waitFor({state:'visible'});await page.locator('.mm-loading').waitFor({state:'detached'});await page.locator('.mm-conversation').waitFor();assert.ok(await page.locator('.mm-conversation-topics button').count()>=2);await page.locator('.mm-conversation-topics button').first().click();assert.match(await page.locator('.mm-conversation-turn').innerText(),/安禾/);await page.screenshot({path:resolve(root,`platform-layout-repeatable-conversation-${width}x${height}.png`),fullPage:true})
 await page.locator('.mm-conversation-more summary').click();await page.getByRole('textbox',{name:'交谈内容'}).fill('我有点担心');await page.getByRole('button',{name:'交谈',exact:true}).click();assert.match(await page.locator('.mm-conversation-turn').innerText(),/我有点担心/)
 await context.close()
}
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
try{await run(390,844);await run(320,568)}finally{await browser.close()}
