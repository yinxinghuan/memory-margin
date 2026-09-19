import type {Rect,World} from './spatial/world'
import {largeDetailPackMeta,largeGeneratedDetails} from './generated/large-scene-detail-pack'

export type LargeAsset='service-console'|'memory-chair'|'memory-archive'|'maintenance-console'
export type LargeZone='access'|'router'|'maintenance'|'arrival'|'observation'
export type LargePlacement={id:string;asset:LargeAsset;source:[number,number,number,number];rect:Rect;obstacle:Rect;zone:LargeZone}
export type LargeDetail={id:string;assetId:string;cell:[number,number];atlas:string;rect:Rect;obstacle?:Rect;zone:LargeZone;kind:'trace'|'furniture';source:'generated'|'fallback'}

export const largeSceneSize={width:768,height:768} as const
export const largeInterior:Rect={x:30,y:54,w:708,h:670}

export const largePlacements:LargePlacement[]=[
 {id:'observation-console-left',asset:'service-console',source:[72,72,368,372],rect:{x:302,y:84,w:70,h:70.8},obstacle:{x:309,y:107,w:56,h:38},zone:'observation'},
 {id:'observation-console-right',asset:'service-console',source:[72,72,368,372],rect:{x:396,y:84,w:70,h:70.8},obstacle:{x:403,y:107,w:56,h:38},zone:'observation'},
 {id:'access-archive-a',asset:'memory-archive',source:[62,67,385,371],rect:{x:148,y:164,w:66,h:63.6},obstacle:{x:156,y:186,w:50,h:34},zone:'access'},
 {id:'access-chair-a',asset:'memory-chair',source:[85,131,341,324],rect:{x:78,y:205,w:58,h:55.1},obstacle:{x:87,y:229,w:38,h:24},zone:'access'},
 {id:'access-archive-b',asset:'memory-archive',source:[62,67,385,371],rect:{x:148,y:286,w:66,h:63.6},obstacle:{x:156,y:308,w:50,h:34},zone:'access'},
 {id:'access-chair-b',asset:'memory-chair',source:[85,131,341,324],rect:{x:78,y:327,w:58,h:55.1},obstacle:{x:87,y:351,w:38,h:24},zone:'access'},
 {id:'router-left',asset:'service-console',source:[72,72,368,372],rect:{x:305,y:330,w:72,h:72.8},obstacle:{x:312,y:353,w:58,h:39},zone:'router'},
 {id:'router-right',asset:'service-console',source:[72,72,368,372],rect:{x:391,y:330,w:72,h:72.8},obstacle:{x:398,y:353,w:58,h:39},zone:'router'},
 {id:'maintenance-terminal-a',asset:'service-console',source:[72,72,368,372],rect:{x:544,y:178,w:70,h:70.8},obstacle:{x:551,y:201,w:56,h:38},zone:'maintenance'},
 {id:'maintenance-table-a',asset:'maintenance-console',source:[63,68,383,372],rect:{x:632,y:190,w:64,h:62.2},obstacle:{x:639,y:213,w:49,h:32},zone:'maintenance'},
 {id:'maintenance-terminal-b',asset:'service-console',source:[72,72,368,372],rect:{x:544,y:300,w:70,h:70.8},obstacle:{x:551,y:323,w:56,h:38},zone:'maintenance'},
 {id:'maintenance-table-b',asset:'maintenance-console',source:[63,68,383,372],rect:{x:632,y:312,w:64,h:62.2},obstacle:{x:639,y:335,w:49,h:32},zone:'maintenance'},
 {id:'arrival-terminal-left',asset:'service-console',source:[72,72,368,372],rect:{x:252,y:590,w:70,h:70.8},obstacle:{x:259,y:613,w:56,h:38},zone:'arrival'},
 {id:'arrival-terminal-right',asset:'service-console',source:[72,72,368,372],rect:{x:446,y:590,w:70,h:70.8},obstacle:{x:453,y:613,w:56,h:38},zone:'arrival'},
 {id:'arrival-buffer',asset:'memory-archive',source:[62,67,385,371],rect:{x:351,y:550,w:66,h:63.6},obstacle:{x:359,y:572,w:50,h:34},zone:'arrival'},
]

/** Authoring-time generated support pack. The build script selects admitted media or a known fallback per semantic slot. */
export const largeDetails:LargeDetail[]=largeGeneratedDetails.map(detail=>({
 id:detail.id,assetId:detail.assetId,cell:[detail.cell[0],detail.cell[1]],atlas:detail.atlas,
 rect:{...detail.rect},...('obstacle' in detail?{obstacle:{...detail.obstacle}}:{}),
 zone:detail.zone as LargeZone,kind:detail.kind,source:detail.source,
}))
export {largeDetailPackMeta}

export const largeReviewWorld:World={
 width:largeSceneSize.width,height:largeSceneSize.height,step:4,actor:{w:9,h:15},
 scenes:{'large-review':{interior:largeInterior,spawn:{x:378,y:680},obstacles:[...largePlacements.map(p=>p.obstacle),...largeDetails.flatMap(detail=>detail.obstacle?[detail.obstacle]:[])]}},
}

export const largeSceneSpawns={
 south:{x:378,y:680},
 center:{x:378,y:470},
 west:{x:218,y:270},
 east:{x:515,y:270},
 north:{x:378,y:150},
} as const
