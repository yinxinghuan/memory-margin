import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {resolve} from 'node:path'

const base=process.env.QA_URL||'http://127.0.0.1:5212/'
const root=resolve('_qa')
async function waitPrimary(page,target,verb){await page.waitForFunction(([a,b])=>{const n=document.querySelector('.mm-primary');return n&&!n.hasAttribute('disabled')&&n.textContent?.includes(a)&&n.textContent?.includes(b)},[target,verb],{timeout:12000})}
async function approach(page,target,verb='查看'){await page.getByRole('button',{name:target,exact:true}).click();await waitPrimary(page,target,verb);await page.locator('.mm-primary').click();await page.locator('.mm-interaction-layer').waitFor()}
async function checkNpcViewport(page,width,height,state,selector){
 await page.waitForTimeout(650);
 const panel=page.locator('.mm-dialog[data-kind="person"]');
 const body=await panel.locator('.mm-dialog-body').boundingBox();
 const buttons=await panel.locator(selector).all();
 for(const button of buttons.slice(0,2)){const box=await button.boundingBox();assert.ok(box&&body&&box.y>=body.y&&box.y+box.height<=body.y+body.height,`${state}: actions must fit without scrolling at ${width}x${height}`)}
 assert.equal(await panel.locator('.mm-dialog-body').evaluate(el=>el.scrollTop),0);
 await page.screenshot({path:resolve(root,`platform-layout-npc-${state}-${width}x${height}.png`),fullPage:true});
}
async function run(width,height){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1}),page=await context.newPage()
 await page.goto(`${base}?qa=experience-parity-v1`,{waitUntil:'networkidle'});await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'});await page.locator('.mm-loading').waitFor({state:'detached'})
 if(await page.getByRole('button',{name:'开始探索'}).count()){await page.screenshot({path:resolve(root,`platform-layout-opening-guidance-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'开始探索'}).click()}
 for(const name of ['地图','背包','菜单'])assert.equal(await page.getByRole('button',{name,exact:true}).count(),1)
 await page.getByRole('button',{name:'地图',exact:true}).click();await page.locator('.mm-atlas').waitFor();assert.match(await page.locator('.mm-atlas').innerText(),/你在这里/);await page.screenshot({path:resolve(root,`platform-layout-real-map-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'回到地图'}).click()
 await page.getByRole('button',{name:'背包',exact:true}).click();await page.locator('.mm-backpack').waitFor();for(const name of ['目标','物品','线索','人物'])assert.equal(await page.getByRole('button',{name,exact:true}).count(),1);await page.screenshot({path:resolve(root,`platform-layout-backpack-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'回到地图'}).click()
 await page.getByRole('button',{name:'菜单',exact:true}).click();await page.locator('.mm-menu').waitFor();assert.match(await page.locator('.mm-menu').innerText(),/操作方法/);await page.getByRole('button',{name:'回到地图'}).click()
 await approach(page,'语音盒','查看');await page.getByRole('button',{name:'播放这段语音'}).click();await page.locator('.mm-loading').waitFor({state:'visible'});await page.locator('.mm-loading').waitFor({state:'detached'});await page.getByRole('button',{name:'回到地图'}).click()
 await approach(page,'迁入回执','查看');await page.getByRole('button',{name:'读回执'}).click();await page.locator('.mm-loading').waitFor({state:'visible'});await page.locator('.mm-loading').waitFor({state:'detached'});await page.getByRole('button',{name:'回到地图'}).click()
 await page.getByRole('button',{name:'背包',exact:true}).click();await page.getByRole('button',{name:'物品',exact:true}).click();assert.ok(await page.locator('.mm-backpack-thumb[data-kind="object"]').count()>=1);await page.screenshot({path:resolve(root,`platform-layout-backpack-items-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'线索',exact:true}).click();assert.ok(await page.locator('.mm-backpack-thumb[data-kind="object"]').count()>=1);await page.screenshot({path:resolve(root,`platform-layout-backpack-clues-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'回到地图'}).click()
 await page.getByRole('button',{name:'去公共走廊',exact:true}).click();await waitPrimary(page,'去公共走廊','前往');await page.locator('.mm-primary').click();await page.locator('.mm-loading').waitFor({state:'visible'});await page.locator('.mm-loading').waitFor({state:'detached'})
 await page.getByRole('button',{name:'地图',exact:true}).click();await page.getByRole('button',{name:'转生居所',exact:true}).click();assert.match(await page.locator('.mm-atlas-route').innerText(),/左侧门/);assert.ok(await page.locator('.mm-atlas-route li').count()>=1);await page.screenshot({path:resolve(root,`platform-layout-real-route-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'回到地图'}).click()
 const neighborSprite=page.locator('.mm-person-sprite[data-entity="neighbor"]');const beforePatrol=await neighborSprite.boundingBox();await page.waitForTimeout(3700);const afterPatrol=await neighborSprite.boundingBox();assert.ok(beforePatrol&&afterPatrol&&Math.abs(afterPatrol.x-beforePatrol.x)>1,'neighbor should patrol while the player is far away');await page.screenshot({path:resolve(root,`platform-layout-npc-patrol-${width}x${height}.png`),fullPage:true})
 await page.getByRole('button',{name:'等电梯的邻居',exact:true}).click();await waitPrimary(page,'等电梯的邻居','交谈');await page.waitForFunction(()=>document.querySelector('.mm-person-sprite[data-entity="neighbor"]')?.getAttribute('data-attending')==='true');assert.equal(await page.locator('.mm-primary').getAttribute('data-actionable'),'true');await page.waitForTimeout(220);assert.notEqual(await page.locator('.mm-primary').evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)');await page.screenshot({path:resolve(root,`platform-layout-npc-facing-player-${width}x${height}.png`),fullPage:true});await page.locator('.mm-primary').click();await page.locator('.mm-interaction-layer').waitFor();await checkNpcViewport(page,width,height,'first-meeting','.mm-actions button');await page.locator('.mm-actions button').filter({hasText:'跟她说话'}).click();await page.locator('.mm-loading').waitFor({state:'visible'});await page.locator('.mm-loading').waitFor({state:'detached'});await page.locator('.mm-conversation').waitFor();assert.ok(await page.locator('.mm-conversation-topics button').count()>=2)
 await checkNpcViewport(page,width,height,'choices','.mm-conversation-topics button');
 assert.equal(await page.locator('.mm-dialog-portrait').evaluate(node=>getComputedStyle(node).backgroundSize),'200% 200%');
 const previousTopics=await page.locator('.mm-conversation-topics').innerText();
 const scrollBefore=await page.locator('.mm-dialog-body').evaluate(node=>node.scrollTop);
 await page.getByRole('button',{name:'放大人物头像'}).click();
 await page.locator('.mm-portrait-viewer[open]').waitFor();
 await page.screenshot({path:resolve(root,`platform-layout-npc-portrait-zoom-${width}x${height}.png`),fullPage:true});
 await page.getByRole('button',{name:'关闭人物大图'}).click();
 await page.locator('.mm-portrait-viewer').waitFor({state:'detached'});
 assert.equal(await page.locator('.mm-conversation-topics').innerText(),previousTopics);
 assert.equal(await page.locator('.mm-dialog-body').evaluate(node=>node.scrollTop),scrollBefore);
 await page.getByRole('button',{name:'放大人物头像'}).click();await page.keyboard.press('Escape');
 await page.locator('.mm-portrait-viewer').waitFor({state:'detached'});

 const firstTopic=page.locator('.mm-conversation-topics button').first(),playerLine=await firstTopic.innerText();await firstTopic.click();await page.locator('.mm-conversation[data-phase="waiting"]').waitFor();assert.match(await page.locator('.mm-conversation-turn--player').innerText(),new RegExp(playerLine));assert.equal(await page.locator('.mm-conversation-options').count(),0);assert.equal(await page.locator('.mm-closeup').count(),0);assert.equal(await page.locator('.mm-message').count(),0);await page.waitForTimeout(200);await page.screenshot({path:resolve(root,`platform-layout-conversation-player-${width}x${height}.png`),fullPage:true})
 await page.locator('.mm-conversation-turn--npc').waitFor();assert.match(await page.locator('.mm-conversation-turn--npc').innerText(),/安禾/);assert.equal(await page.locator('.mm-conversation-options').count(),0);await page.waitForTimeout(200);await page.screenshot({path:resolve(root,`platform-layout-conversation-reply-${width}x${height}.png`),fullPage:true})
 while(await page.locator('.mm-conversation-continue').count())await page.locator('.mm-conversation-continue').click()
 await page.locator('.mm-conversation-options').waitFor();assert.ok(await page.locator('.mm-conversation-topics button').count()>=2);await page.screenshot({path:resolve(root,`platform-layout-repeatable-conversation-${width}x${height}.png`),fullPage:true})
 await page.locator('.mm-conversation-more summary').click();await page.getByRole('textbox',{name:'交谈内容'}).fill('我有点担心');await page.getByRole('button',{name:'交谈',exact:true}).click();await page.locator('.mm-conversation[data-phase="waiting"]').waitFor();assert.match(await page.locator('.mm-conversation-turn--player').innerText(),/我有点担心/);await page.locator('.mm-conversation-turn--npc').waitFor()
 while(await page.locator('.mm-conversation-continue').count())await page.locator('.mm-conversation-continue').click()
 await page.locator('.mm-conversation-options').waitFor();await page.getByRole('button',{name:'回到地图'}).click();await page.locator('.mm-primary').click();await page.locator('.mm-conversation-history').waitFor();await page.locator('.mm-conversation-history summary').click();assert.equal(await page.locator('.mm-conversation-history p').count(),4);await page.screenshot({path:resolve(root,`platform-layout-conversation-history-${width}x${height}.png`),fullPage:true});await page.getByRole('button',{name:'回到地图'}).click()
 await page.getByRole('button',{name:'背包',exact:true}).click();await page.getByRole('button',{name:'人物',exact:true}).click();assert.ok(await page.locator('.mm-backpack-thumb[data-kind="person"]').count()>=1);await page.screenshot({path:resolve(root,`platform-layout-backpack-people-${width}x${height}.png`),fullPage:true})
 await context.close()
}
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
try{await run(390,844);await run(320,568)}finally{await browser.close()}
