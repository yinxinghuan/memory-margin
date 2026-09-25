import type {Rect} from './spatial/world'

export type AtmosphereMode='baseline'|'props'|'ground'
export type AmbientAtlas='home-furniture'|'home-props'|'service-memory-chair'|'service-memory-archive'|'service-maintenance'
export type AtlasPlacement={id:string;kind:'furniture'|'prop';atlas:AmbientAtlas;cell:[number,number];source:[number,number,number,number];rect:Rect;obstacle?:Rect;flipX?:boolean}
export type GroundCluster={id:string;clip:Rect;obstacle:Rect}

const requested=typeof location==='undefined'?null:new URLSearchParams(location.search).get('atmosphere')
export const atmosphereMode:AtmosphereMode=requested==='baseline'?'baseline':requested==='ground'?'ground':'props'

/** Independent furniture and lived-in items. Art and collision share each placement. */
export const homeAtlasPlacements:AtlasPlacement[]=[
 {id:'sleep-bench',kind:'furniture',atlas:'home-furniture',cell:[0,0],source:[125,48,270,422],rect:{x:64,y:232,w:50,h:88},obstacle:{x:70,y:246,w:38,h:67}},
 {id:'storage-cabinet',kind:'furniture',atlas:'home-furniture',cell:[1,0],source:[68,100,365,318],rect:{x:268,y:242,w:49,h:39},obstacle:{x:272,y:251,w:42,h:26}},
 {id:'repair-cart',kind:'furniture',atlas:'home-furniture',cell:[0,1],source:[107,85,296,360],rect:{x:267,y:329,w:40,h:49},obstacle:{x:272,y:342,w:31,h:31}},
 {id:'worn-slippers',kind:'prop',atlas:'home-props',cell:[0,0],source:[50,45,219,239],rect:{x:112,y:305,w:12,h:14}},
]

export const serviceAtlasPlacements:AtlasPlacement[]=[
 {id:'memory-archive-buffer',kind:'furniture',atlas:'service-memory-archive',cell:[0,0],source:[62,67,385,371],rect:{x:76,y:165,w:52,h:50.1},obstacle:{x:82,y:183,w:41,h:27}},
 {id:'memory-intake-chair',kind:'furniture',atlas:'service-memory-chair',cell:[0,0],source:[85,131,341,324],rect:{x:66,y:246,w:48,h:45.6},obstacle:{x:74,y:267,w:31,h:20}},
 {id:'service-maintenance-console',kind:'furniture',atlas:'service-maintenance',cell:[0,0],source:[63,68,383,372],rect:{x:270,y:278,w:48,h:46.6},obstacle:{x:276,y:295,w:37,h:24}},
]

// Existing platform-generated furniture, arranged for four different daily functions.
function place(source:AtlasPlacement,id:string,x:number,y:number):AtlasPlacement{
 const dx=x-source.rect.x,dy=y-source.rect.y
 return {...source,id,rect:{...source.rect,x,y},obstacle:source.obstacle?{...source.obstacle,x:source.obstacle.x+dx,y:source.obstacle.y+dy}:undefined}
}
export const expandedPlacements:Record<string,AtlasPlacement[]>={
 commons:[place(serviceAtlasPlacements[1],'commons-seat-a',78,248),place(serviceAtlasPlacements[1],'commons-seat-b',128,288),place(homeAtlasPlacements[1],'commons-cabinet',259,113),place(homeAtlasPlacements[2],'commons-serving-cart',242,337)],
 'neighbor-room':[place(homeAtlasPlacements[0],'neighbor-bed',76,100),place(homeAtlasPlacements[1],'neighbor-cabinet',252,98),place(serviceAtlasPlacements[1],'neighbor-chair',235,310),place(homeAtlasPlacements[3],'neighbor-slippers',126,175)],
 repair:[place(serviceAtlasPlacements[1],'repair-seat',90,201),place(serviceAtlasPlacements[2],'repair-tools',81,111),place(serviceAtlasPlacements[0],'repair-buffer',260,105),place(homeAtlasPlacements[2],'repair-cart',260,332)],
 archive:[place(serviceAtlasPlacements[0],'archive-bank-a',78,92),place(serviceAtlasPlacements[0],'archive-bank-b',138,92),place(serviceAtlasPlacements[0],'archive-bank-c',198,92),place(serviceAtlasPlacements[0],'archive-bank-d',258,92),place(serviceAtlasPlacements[0],'archive-bank-e',268,328)],
}
export function atmospherePlacements(scene:string):AtlasPlacement[]{
 return scene==='home'?homeAtlasPlacements:scene==='service'?serviceAtlasPlacements:expandedPlacements[scene]??[]
}

/** Regions admitted from the one-piece platform scene plate; the diagonal chair is excluded. */
export const homeGroundClusters:GroundCluster[]=[
 {id:'baked-sleep-bench',clip:{x:64,y:149,w:57,h:127},obstacle:{x:70,y:160,w:44,h:105}},
 {id:'baked-storage-cabinet',clip:{x:224,y:128,w:101,h:51},obstacle:{x:232,y:137,w:84,h:34}},
 {id:'baked-repair-cart',clip:{x:68,y:326,w:47,h:58},obstacle:{x:75,y:337,w:34,h:41}},
]

export function atmosphereObstacles(mode:AtmosphereMode,scene:string):Rect[]{
 if(mode==='props')return atmospherePlacements(scene).flatMap(p=>p.obstacle?[p.obstacle]:[])
 if(scene!=='home')return []
 if(mode==='ground')return homeGroundClusters.map(p=>p.obstacle)
 return []
}
