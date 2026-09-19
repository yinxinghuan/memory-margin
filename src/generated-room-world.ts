import type {Rect,World} from './spatial/world'

export type AuditAsset='scanner'|'comparator'|'buffer'
export type AuditPlacement={id:string;asset:AuditAsset;source:[number,number,number,number];rect:Rect;obstacle:Rect}
export const auditInterior:Rect={x:54,y:62,w:276,h:390}
export const auditPlacements:AuditPlacement[]=[
 {id:'source-scanner',asset:'scanner',source:[62,83,450,353],rect:{x:78,y:145,w:76,h:60},obstacle:{x:88,y:177,w:56,h:22}},
 {id:'target-scanner',asset:'scanner',source:[62,83,450,353],rect:{x:230,y:145,w:76,h:60},obstacle:{x:240,y:177,w:56,h:22}},
 {id:'comparison-console',asset:'comparator',source:[71,111,371,296],rect:{x:142,y:258,w:100,h:80},obstacle:{x:151,y:300,w:82,h:25}},
 {id:'sealed-buffer',asset:'buffer',source:[72,80,367,364],rect:{x:250,y:346,w:62,h:60},obstacle:{x:258,y:382,w:46,h:20}},
]
export const auditRoomWorld:World={width:384,height:512,step:4,actor:{w:9,h:15},scenes:{'generated-audit-room':{interior:auditInterior,spawn:{x:187,y:420},obstacles:auditPlacements.map(item=>item.obstacle)}}}
export const auditTargets={source:{x:112,y:218},target:{x:264,y:218},comparison:{x:188,y:350},buffer:{x:225,y:390}} as const
export const auditExits=[{id:'south-door',anchor:{x:192,y:480}}] as const
