import {Direction} from '@rpgjs/common'
import type {EntityId} from './world'
// Every atlas cell and the aligned NPC sprites share one world scale and foot anchor.
// Shared scale for the entire roster; actual visible heights are reviewed together.
export const actorCellWorld=84
export const actorFootFraction=243/256
export const worldPropCell:Partial<Record<EntityId,[number,number]>>={
 'voice-box':[0,0],receipt:[1,0],'breakfast-card':[2,0],seal:[0,1],'hall-notice':[1,1],ledger:[2,1],
 'terms-card':[0,2],'choice-desk':[1,2],'preview-screen':[2,2],
}
const heroFoot=actorFootFraction
const pose=(column:number)=>({animations:({direction}:{direction:Direction})=>[[{frameX:column,frameY:({down:0,left:1,right:2,up:3})[direction],time:0,anchor:[.5,heroFoot],scale:[actorCellWorld/256,actorCellWorld/256],x:4.5,y:15}]]})
export const heroSheet={id:'memory-arrival-player',image:'./art/rebuild-20260924/hero-sheet.png',width:768,height:1024,framesWidth:3,framesHeight:4,textures:{stand:pose(1),'step-left':pose(0),'step-center':pose(1),'step-right':pose(2)}}
