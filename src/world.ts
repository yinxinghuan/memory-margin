import type {World,Point,Rect} from './spatial/world'

export type Scene='home'|'hall'|'service'
export type EntityId='voice-box'|'receipt'|'breakfast-card'|'home-door'|'home-return'|'neighbor'|'caretaker'|'seal'|'hall-notice'|'service-door'|'clerk'|'ledger'|'terms-card'|'choice-desk'|'preview-screen'|'service-exit'
export type Entity={id:EntityId;scene:Scene;label:[string,string];approach:Point;visual:Rect;obstacle?:Rect;kind:'memory'|'record'|'door'|'person'|'seal'|'desk';actions:string[]}

export const entities:Record<EntityId,Entity>={
 'voice-box':{id:'voice-box',scene:'home',label:['语音盒','Voice box'],approach:{x:118,y:248},visual:{x:90,y:186,w:56,h:42},obstacle:{x:90,y:190,w:56,h:30},kind:'memory',actions:['listen-voice','revisit-voice']},
 receipt:{id:'receipt',scene:'home',label:['迁入回执','Arrival receipt'],approach:{x:260,y:251},visual:{x:239,y:187,w:38,h:40},obstacle:{x:239,y:198,w:38,h:22},kind:'record',actions:['read-receipt']},
 'breakfast-card':{id:'breakfast-card',scene:'home',label:['早餐便条','Breakfast note'],approach:{x:113,y:352},visual:{x:76,y:328,w:34,h:27},kind:'record',actions:['read-breakfast']},
 'home-door':{id:'home-door',scene:'home',label:['去公共走廊','To the hall'],approach:{x:187,y:115},visual:{x:167,y:72,w:42,h:40},kind:'door',actions:['to-hall']},
 'home-return':{id:'home-return',scene:'hall',label:['回到居所','Back home'],approach:{x:82,y:169},visual:{x:56,y:144,w:24,h:50},kind:'door',actions:['to-home']},
 neighbor:{id:'neighbor',scene:'hall',label:['等电梯的邻居','Neighbor by the lift'],approach:{x:133,y:256},visual:{x:125,y:222,w:20,h:32},obstacle:{x:126,y:230,w:18,h:20},kind:'person',actions:['talk-neighbor','ask-neighbor-preview','debrief-neighbor']},
 caretaker:{id:'caretaker',scene:'hall',label:['冷脸的值守人','Stern attendant'],approach:{x:244,y:279},visual:{x:250,y:245,w:20,h:32},obstacle:{x:251,y:252,w:18,h:20},kind:'person',actions:['talk-caretaker','ask-caretaker-preview']},
 seal:{id:'seal',scene:'hall',label:['墙上的封签','Seal on the wall'],approach:{x:257,y:204},visual:{x:294,y:176,w:24,h:34},kind:'seal',actions:['read-seal']},
 'hall-notice':{id:'hall-notice',scene:'hall',label:['走廊告示','Hall notice'],approach:{x:113,y:149},visual:{x:75,y:109,w:34,h:32},kind:'record',actions:['read-hall-notice']},
 'service-door':{id:'service-door',scene:'hall',label:['记忆服务点','Memory service'],approach:{x:290,y:376},visual:{x:307,y:352,w:22,h:50},kind:'door',actions:['to-service']},
 clerk:{id:'clerk',scene:'service',label:['窗口职员','Counter clerk'],approach:{x:178,y:242},visual:{x:177,y:181,w:22,h:36},obstacle:{x:177,y:193,w:22,h:25},kind:'person',actions:['talk-clerk','confront-clerk-preview']},
 ledger:{id:'ledger',scene:'service',label:['公开使用记录','Public use register'],approach:{x:117,y:291},visual:{x:88,y:238,w:50,h:38},obstacle:{x:88,y:246,w:50,h:29},kind:'record',actions:['read-ledger']},
 'terms-card':{id:'terms-card',scene:'service',label:['服务说明牌','Service terms'],approach:{x:274,y:174},visual:{x:281,y:114,w:32,h:34},kind:'record',actions:['read-terms']},
 'choice-desk':{id:'choice-desk',scene:'service',label:['记忆处理台','Memory desk'],approach:{x:252,y:302},visual:{x:251,y:237,w:58,h:44},obstacle:{x:251,y:246,w:58,h:35},kind:'desk',actions:['compare-records','choose-keep','choose-lend','inspect-decision']},
 'preview-screen':{id:'preview-screen',scene:'service',label:['窗口预览屏','Preview screen'],approach:{x:281,y:365},visual:{x:269,y:335,w:39,h:27},kind:'desk',actions:['read-preview-log','stop-preview','trace-preview']},
 'service-exit':{id:'service-exit',scene:'service',label:['回到公共走廊','Back to the hall'],approach:{x:185,y:397},visual:{x:166,y:414,w:42,h:22},kind:'door',actions:['service-to-hall']},
}

export const sceneLabels:Record<Scene,[string,string]>={home:['转生居所','Arrival Room'],hall:['公共走廊','Shared Hall'],service:['记忆服务点','Memory Service']}
const obstacles=(scene:Scene)=>Object.values(entities).filter(e=>e.scene===scene&&e.obstacle).map(e=>e.obstacle!)
export const world:World={width:384,height:512,step:4,actor:{w:9,h:15},scenes:{
 home:{interior:{x:54,y:64,w:276,h:390},spawn:{x:190,y:366},obstacles:obstacles('home')},
 hall:{interior:{x:54,y:64,w:276,h:390},spawn:{x:90,y:190},obstacles:obstacles('hall')},
 service:{interior:{x:54,y:64,w:276,h:390},spawn:{x:187,y:380},obstacles:obstacles('service')},
}}
export const portals:Record<string,{from:Scene;scene:Scene;position:Point}>={
 'to-hall':{from:'home',scene:'hall',position:{x:90,y:190}},
 'to-home':{from:'hall',scene:'home',position:{x:184,y:130}},
 'to-service':{from:'hall',scene:'service',position:{x:187,y:380}},
 'service-to-hall':{from:'service',scene:'hall',position:{x:286,y:349}},
}
