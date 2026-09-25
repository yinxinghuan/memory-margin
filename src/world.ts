import type {World,Point,Rect} from './spatial/world'
import {atmosphereMode,atmosphereObstacles} from './atmosphere'

export type Scene='home'|'hall'|'service'|'commons'|'neighbor-room'|'repair'|'archive'
export type EntityId='commons-door'|'commons-return'|'neighbor-door'|'neighbor-return'|'repair-door'|'repair-return'|'archive-door'|'archive-return'|'scent-station'|'neighbor-keepsake'|'repair-scanner'|'archive-index'|'voice-box'|'receipt'|'breakfast-card'|'home-door'|'home-return'|'neighbor'|'caretaker'|'seal'|'hall-notice'|'service-door'|'clerk'|'ledger'|'terms-card'|'choice-desk'|'preview-screen'|'service-exit'
export type Entity={id:EntityId;scene:Scene;label:[string,string];approach:Point;visual:Rect;activation?:Rect;threshold?:Point;side?:'N'|'E'|'S'|'W';obstacle?:Rect;kind:'memory'|'record'|'door'|'person'|'seal'|'desk';actions:string[]}

/** Reused by modular art placement and by the RPG collision export. */
export const furniture={
 voiceTable:{x:94,y:176,w:48,h:48},receiptTable:{x:240,y:176,w:46,h:46},
 homeRugLeft:{x:70,y:333,w:106,h:53},homeRugRight:{x:217,y:336,w:91,h:46},
 ledgerTable:{x:97,y:222,w:50,h:50},decisionDesk:{x:258,y:223,w:50,h:50},
} satisfies Record<string,Rect>


function door(id:EntityId,scene:Scene,label:[string,string],side:'N'|'E'|'S'|'W',at:number,action:string):Entity{
 const horizontal=side==='N'||side==='S',x=horizontal?at:side==='W'?30:318,y=horizontal?(side==='N'?0:398):at
 return {id,scene,label,kind:'door',side,visual:{x,y,w:horizontal?42:36,h:horizontal?66:50},approach:horizontal?{x:at+18,y:side==='N'?68:428}:{x:side==='W'?60:310,y:at+16},threshold:horizontal?{x:at+18,y:side==='N'?64:436}:{x:side==='W'?54:321,y:at+16},activation:horizontal?{x:at,y:side==='N'?64:404,w:42,h:50}:{x:side==='W'?54:282,y:at,w:48,h:50},actions:[action]}
}

export const entities:Record<EntityId,Entity>={
 'commons-door':door('commons-door','hall',['去公共生活区','To the commons'],'N',166,'to-commons'),
 'commons-return':door('commons-return','commons',['回公共走廊','To the shared hall'],'S',166,'commons-to-hall'),
 'neighbor-door':door('neighbor-door','commons',['去邻居住所','To the neighbor’s room'],'W',158,'to-neighbor-room'),
 'neighbor-return':door('neighbor-return','neighbor-room',['回公共生活区','To the commons'],'E',158,'neighbor-to-commons'),
 'repair-door':door('repair-door','commons',['去记忆修复铺','To the repair shop'],'N',166,'to-repair'),
 'repair-return':door('repair-return','repair',['回公共生活区','To the commons'],'S',166,'repair-to-commons'),
 'archive-door':door('archive-door','commons',['去档案区','To the archive'],'E',284,'to-archive'),
 'archive-return':door('archive-return','archive',['回公共生活区','To the commons'],'W',284,'archive-to-commons'),
 'scent-station':{id:'scent-station',scene:'commons',label:['共享早餐台','Shared breakfast station'],kind:'desk',visual:{x:252,y:200,w:48,h:40},approach:{x:264,y:252},obstacle:{x:252,y:220,w:48,h:20},actions:['try-shared-scent']},
 'neighbor-keepsake':{id:'neighbor-keepsake',scene:'neighbor-room',label:['留给来客的录音','A recording for visitors'],kind:'record',visual:{x:244,y:216,w:48,h:32},approach:{x:257,y:268},obstacle:{x:244,y:232,w:48,h:16},actions:['read-neighbor-keepsake']},
 'repair-scanner':{id:'repair-scanner',scene:'repair',label:['记忆检测台','Memory diagnostic bench'],kind:'desk',visual:{x:235,y:218,w:58,h:42},approach:{x:252,y:280},obstacle:{x:235,y:242,w:58,h:18},actions:['diagnose-voice']},
 'archive-index':{id:'archive-index',scene:'archive',label:['档案检索台','Archive index'],kind:'record',visual:{x:244,y:182,w:48,h:38},approach:{x:260,y:242},obstacle:{x:244,y:202,w:48,h:18},actions:['read-archive-index']},

 'voice-box':{id:'voice-box',scene:'home',label:['语音盒','Voice box'],approach:{x:118,y:248},visual:{x:90,y:175,w:56,h:42},obstacle:{x:furniture.voiceTable.x,y:furniture.voiceTable.y+32,w:furniture.voiceTable.w,h:16},kind:'memory',actions:['listen-voice','revisit-voice','try-save-morning','save-morning']},
 receipt:{id:'receipt',scene:'home',label:['迁入回执','Arrival receipt'],approach:{x:260,y:251},visual:{x:239,y:175,w:38,h:40},obstacle:furniture.receiptTable,kind:'record',actions:['read-receipt']},
 'breakfast-card':{id:'breakfast-card',scene:'home',label:['早餐便条','Breakfast note'],approach:{x:113,y:352},visual:{x:76,y:328,w:34,h:27},kind:'record',actions:['read-breakfast']},
 'home-door':{id:'home-door',scene:'home',label:['去公共走廊','To the hall'],approach:{x:184,y:68},threshold:{x:184,y:64},side:'N',visual:{x:163,y:0,w:50,h:76},activation:{x:163,y:64,w:50,h:52},kind:'door',actions:['to-hall']},
 'home-return':{id:'home-return',scene:'hall',label:['回到居所','Back home'],approach:{x:60,y:160},threshold:{x:54,y:160},side:'W',visual:{x:30,y:144,w:36,h:50},activation:{x:54,y:144,w:48,h:50},kind:'door',actions:['to-home']},
 neighbor:{id:'neighbor',scene:'hall',label:['等电梯的邻居','Neighbor by the lift'],approach:{x:133,y:256},visual:{x:125,y:222,w:20,h:32},obstacle:{x:126,y:230,w:18,h:20},kind:'person',actions:['talk-neighbor','ask-neighbor-preview','debrief-neighbor']},
 caretaker:{id:'caretaker',scene:'hall',label:['冷脸的值守人','Stern attendant'],approach:{x:244,y:279},visual:{x:250,y:245,w:20,h:32},obstacle:{x:251,y:252,w:18,h:20},kind:'person',actions:['talk-caretaker','ask-caretaker-preview']},
 seal:{id:'seal',scene:'hall',label:['墙上的封签','Seal on the wall'],approach:{x:257,y:204},visual:{x:294,y:176,w:24,h:34},kind:'seal',actions:['read-seal']},
 'hall-notice':{id:'hall-notice',scene:'hall',label:['走廊告示','Hall notice'],approach:{x:113,y:149},visual:{x:75,y:109,w:34,h:32},kind:'record',actions:['read-hall-notice']},
 'service-door':{id:'service-door',scene:'hall',label:['记忆服务点','Memory service'],approach:{x:316,y:368},threshold:{x:321,y:368},side:'E',visual:{x:318,y:352,w:36,h:50},activation:{x:282,y:352,w:48,h:50},kind:'door',actions:['to-service']},
 clerk:{id:'clerk',scene:'service',label:['窗口职员','Counter clerk'],approach:{x:178,y:153},visual:{x:177,y:89,w:22,h:36},obstacle:{x:177,y:105,w:22,h:20},kind:'person',actions:['talk-clerk','confront-clerk-preview']},
 ledger:{id:'ledger',scene:'archive',label:['公开使用记录','Public use register'],approach:{x:117,y:291},visual:{x:88,y:223,w:50,h:38},obstacle:furniture.ledgerTable,kind:'record',actions:['read-ledger']},
 'terms-card':{id:'terms-card',scene:'service',label:['服务说明牌','Service terms'],approach:{x:274,y:174},visual:{x:281,y:24,w:32,h:34},kind:'record',actions:['read-terms']},
 'choice-desk':{id:'choice-desk',scene:'service',label:['记忆处理台','Memory desk'],approach:{x:252,y:302},visual:{x:251,y:220,w:58,h:44},obstacle:furniture.decisionDesk,kind:'desk',actions:['compare-records','choose-keep','choose-lend','inspect-decision']},
 'preview-screen':{id:'preview-screen',scene:'service',label:['窗口预览屏','Preview screen'],approach:{x:281,y:365},visual:{x:269,y:335,w:39,h:27},kind:'desk',actions:['read-preview-log','stop-preview','trace-preview']},
 'service-exit':{id:'service-exit',scene:'service',label:['回到公共走廊','Back to the hall'],approach:{x:184,y:436},threshold:{x:184,y:436},side:'S',visual:{x:166,y:398,w:42,h:66},activation:{x:166,y:404,w:42,h:50},kind:'door',actions:['service-to-hall']},
}

export const sceneLabels:Record<Scene,[string,string]>={home:['转生居所','Arrival Room'],hall:['公共走廊','Shared Hall'],service:['记忆服务点','Memory Service'],commons:['公共生活区','Commons'],'neighbor-room':['邻居住所','Neighbor’s Room'],repair:['记忆修复铺','Repair Shop'],archive:['档案区','Archive']}
const obstacles=(scene:Scene)=>[
 ...Object.values(entities).filter(e=>e.scene===scene&&e.obstacle).map(e=>e.obstacle!),
 ...atmosphereObstacles(atmosphereMode,scene),
]
export const world:World={width:384,height:512,step:4,actor:{w:9,h:15},scenes:{
 home:{interior:{x:54,y:64,w:276,h:390},spawn:{x:190,y:366},obstacles:obstacles('home')},
 hall:{interior:{x:54,y:64,w:276,h:390},spawn:{x:90,y:190},obstacles:obstacles('hall')},
 service:{interior:{x:54,y:64,w:276,h:390},spawn:{x:187,y:380},obstacles:obstacles('service')},
 commons:{interior:{x:54,y:64,w:276,h:390},spawn:{x:184,y:428},obstacles:obstacles('commons')},
 'neighbor-room':{interior:{x:54,y:64,w:276,h:390},spawn:{x:310,y:174},obstacles:obstacles('neighbor-room')},
 repair:{interior:{x:54,y:64,w:276,h:390},spawn:{x:184,y:428},obstacles:obstacles('repair')},
 archive:{interior:{x:54,y:64,w:276,h:390},spawn:{x:60,y:300},obstacles:obstacles('archive')},
}}
export const portals:Record<string,{from:Scene;scene:Scene;position:Point;target:EntityId}>={
 'to-commons':{from:'hall',scene:'commons',position:{x:184,y:428},target:'commons-return'},
 'commons-to-hall':{from:'commons',scene:'hall',position:{x:184,y:68},target:'commons-door'},
 'to-neighbor-room':{from:'commons',scene:'neighbor-room',position:{x:310,y:174},target:'neighbor-return'},
 'neighbor-to-commons':{from:'neighbor-room',scene:'commons',position:{x:60,y:174},target:'neighbor-door'},
 'to-repair':{from:'commons',scene:'repair',position:{x:184,y:428},target:'repair-return'},
 'repair-to-commons':{from:'repair',scene:'commons',position:{x:184,y:68},target:'repair-door'},
 'to-archive':{from:'commons',scene:'archive',position:{x:60,y:300},target:'archive-return'},
 'archive-to-commons':{from:'archive',scene:'commons',position:{x:310,y:300},target:'archive-door'},
 'to-hall':{from:'home',scene:'hall',position:{x:60,y:160},target:'home-return'},
 'to-home':{from:'hall',scene:'home',position:{x:184,y:68},target:'home-door'},
 'to-service':{from:'hall',scene:'service',position:{x:184,y:436},target:'service-exit'},
 'service-to-hall':{from:'service',scene:'hall',position:{x:316,y:368},target:'service-door'},
}
export function entityNear(e:Entity,p:Point,distance=33){
 if(!e.activation)return Math.hypot(p.x-e.approach.x,p.y-e.approach.y)<distance
 const feet={x:p.x+world.actor.w/2,y:p.y+world.actor.h},r=e.activation
 return feet.x>=r.x&&feet.x<=r.x+r.w&&feet.y>=r.y&&feet.y<=r.y+r.h
}
