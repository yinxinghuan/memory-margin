import {chromium} from 'playwright'
import {resolve} from 'node:path'

const root=resolve('_qa')
const routes={
 zh:{home:'去公共走廊',enterHall:'走进走廊',backHome:'回到居所',service:'记忆服务点',enterService:'进入服务点',exit:'回到公共走廊'},
}

async function waitNear(page,label){
 await page.waitForFunction(text=>[...document.querySelectorAll('button.mm-hotspot--near')].some(node=>node.getAttribute('aria-label')===text),label)
 await page.waitForTimeout(120)
}
async function approach(page,label){
 await page.getByRole('button',{name:label,exact:true}).click()
 await waitNear(page,label)
}
async function enter(page,label,action,scene){
 await page.getByRole('button',{name:label,exact:true}).click()
 await waitNear(page,label)
 await page.locator('.mm-primary').click()
 await page.locator(`.mm-map[data-scene="${scene}"]`).waitFor()
 await page.waitForTimeout(160)
}
async function shot(page,name){await page.screenshot({path:resolve(root,name),fullPage:true})}
async function move(page,key,duration){await page.keyboard.down(key);await page.waitForTimeout(duration);await page.keyboard.up(key)}

async function capture(width,height,suffix,all){
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1})
 await page.goto('http://127.0.0.1:5212/',{waitUntil:'networkidle'})
 await page.addStyleTag({content:'#alteru-guest-banner{display:none!important}'})
 await page.locator('.mm-loading').waitFor({state:'detached'})
 if(width<=320){await move(page,'ArrowUp',3400);await waitNear(page,routes.zh.home)}else await approach(page,routes.zh.home)
 await shot(page,`platform-layout-door-review-home-north-${suffix}.png`)
 await enter(page,routes.zh.home,routes.zh.enterHall,'hall')
 await waitNear(page,routes.zh.backHome)
 await shot(page,`platform-layout-door-review-hall-west-${suffix}.png`)
 if(width<=320){await move(page,'ArrowDown',2300);await move(page,'ArrowRight',2850);await waitNear(page,routes.zh.service)}else await approach(page,routes.zh.service)
 await shot(page,`platform-layout-door-review-hall-east-${suffix}.png`)
 await enter(page,routes.zh.service,routes.zh.enterService,'service')
 await waitNear(page,routes.zh.exit)
 await shot(page,`platform-layout-door-review-service-south-${suffix}.png`)
 if(!all){
  // Keep the narrow evidence set compact: the two direction classes are enough.
  for(const name of [`platform-layout-door-review-home-north-${suffix}.png`,`platform-layout-door-review-hall-west-${suffix}.png`])await import('node:fs/promises').then(fs=>fs.unlink(resolve(root,name)))
 }
 await browser.close()
}

if(process.argv[2]!=='320')await capture(390,844,'390x844',true)
if(process.argv[2]!=='390')await capture(320,568,'320x568',false)
