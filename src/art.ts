import {Direction} from '@rpgjs/common'
import type {Scene} from './world'

export const backgrounds:Record<Scene,string>={home:'./art/home.png',hall:'./art/hall.png',service:'./art/service.png'}
const pose=(column:number)=>({animations:({direction}:{direction:Direction})=>[[{frameX:column,frameY:({down:0,left:1,right:2,up:3})[direction],time:0,anchor:[.5,.91],scale:[1,1],x:4.5,y:15}]]})
export const heroSheet={id:'memory-arrival-player',image:'./art/hero.png',width:96,height:128,framesWidth:3,framesHeight:4,textures:{stand:pose(1),'step-left':pose(0),'step-center':pose(1),'step-right':pose(2)}}
