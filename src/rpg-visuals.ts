import {Assets,Graphics,type Container,type Sprite} from 'pixi.js'
import {Direction} from '@rpgjs/common'
import type {RpgEvent} from '@rpgjs/server'
import layers from './scene-layers.json'
import {actorCellWorld,actorFootFraction,heroSheet} from './art'
import {entities,world,type Scene} from './world'
import type {NpcMotionState} from './npc-motion'
const live=new Map<string,RpgEvent>()
const npcIds=['neighbor','caretaker','clerk'] as const
const pose=(column:number)=>({animations:({direction}:{direction:Direction})=>[[{frameX:column,frameY:({down:0,left:1,right:2,up:3})[direction],time:0,anchor:[.5,actorFootFraction],scale:[actorCellWorld/256,actorCellWorld/256]}]]})
export const sceneSheets=[...layers.map(layer=>({id:layer.id,image:layer.image,width:layer.width,height:layer.height,framesWidth:1,framesHeight:1,textures:{stand:{animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[0,0],scale:[layer.scale,layer.scale],x:layer.x,y:layer.y}]]}}})),...npcIds.map(id=>({id:`mm-npc-${id}`,image:`./art/rebuild-20260924/${id}-sheet.png`,width:768,height:1024,framesWidth:3,framesHeight:4,textures:{stand:pose(1),'step-left':pose(0),'step-center':pose(1),'step-right':pose(2)}}))]
export async function prepareScene(scene:string){const textures=await Assets.load([heroSheet.image,...sceneSheets.filter(s=>layers.some(l=>l.id===s.id&&l.scene===scene)||npcIds.some(id=>`mm-npc-${id}`===s.id&&entities[id].scene===scene)).map(s=>s.image)]);for(const texture of Object.values(textures) as any[])if(texture?.source)texture.source.scaleMode='nearest'}
export function sceneEvents(scene:string){
 const statics=layers.filter(l=>l.scene===scene).map(layer=>({id:layer.id,x:0,y:0,event:{name:layer.id,onInit(this:RpgEvent){this.setGraphic(layer.id);this.setHitbox(1,1);this.through=true;this.animationFixed=true;this.z.set(layer.depth-1);live.set(`${scene}:${layer.id}`,this)}}}))
 const npcs=npcIds.filter(id=>entities[id].scene===scene).map(id=>{const e=entities[id];return{id:`npc-${id}`,x:e.visual.x+e.visual.w/2,y:e.visual.y+e.visual.h,event:{name:`npc-${id}`,onInit(this:RpgEvent){this.setGraphic(`mm-npc-${id}`);this.setHitbox(1,1);this.through=true;this.animationFixed=true;live.set(`${scene}:npc-${id}`,this)}}}})
 return [...statics,...npcs]
}
export function projectResident(id:typeof npcIds[number],state:NpcMotionState){
 const event=live.get(`${entities[id].scene}:npc-${id}`);if(!event)return
 const direction=({down:Direction.Down,left:Direction.Left,right:Direction.Right,up:Direction.Up})[state.facing],pose=['step-left','stand','step-right'][state.frame]
 let dirty=false
 if(event.x()!==state.position.x||event.y()!==state.position.y){void event.teleport(state.position);dirty=true}
 if(event.direction()!==direction){event.direction.set(direction);dirty=true}
 if(event.animationName()!==pose){event.animationName.set(pose);dirty=true}
 if(dirty)event.syncChanges()
}
export function updateSceneVisualState(scene:Scene,facts:Record<string,unknown>){
 const event=live.get(`${scene}:service-object-preview-screen`);if(!event)return
 const graphic=facts.voiceRevisited?'service-object-preview-screen':null
 const tint=facts.previewStopped?'#52616a':facts.previewTraced?'#ffc778':'white'
 if(event.tint()!==tint){event.tint.set(tint);event.syncChanges()}
 if((event.graphics()[0]??null)!==graphic){event.setGraphic(graphic?[graphic]:[]);event.syncChanges()}
}

// One small stencil per foreground texture. No raster uploads or scene rebakes while walking.
export function createForegroundReveal(){
 let active='',nextScan=0
 let masks:{sprite:Sprite;mask:Graphics}[]=[]
 return (client:any,scene:string,position:{x:number;y:number})=>{
  const now=performance.now()
  if(active!==scene){for(const {sprite,mask} of masks){if(!sprite.destroyed)sprite.mask=null;if(!mask.destroyed)mask.destroy()}masks=[];active=scene;nextScan=0}
  if(now>=nextScan||!masks.length){
   nextScan=now+500
   const visit=(node:Container)=>{
    const sprite=node as Sprite,label=sprite.texture?.source?.label
    if(typeof label==='string'&&label.includes(`/rpg-layers/${scene}-front-`)&&!masks.some(m=>m.sprite===sprite)&&sprite.parent){
     const mask=new Graphics().rect(-1000,-1000,2000,2000).fill(0xffffff).ellipse(0,0,38,45).cut()
     mask.label='mm-local-foreground-reveal';sprite.parent.addChild(mask);mask.visible=false;masks.push({sprite,mask})
    }
    for(const child of [...(node.children??[])])visit(child)
   }
   if(client.canvasApp?.stage)visit(client.canvasApp.stage)
   masks=masks.filter(m=>!m.sprite.destroyed&&!m.mask.destroyed)
  }
  const room=world.scenes[scene],near=position.y>room.interior.y+room.interior.h-85
  for(const {sprite,mask} of masks){
   mask.visible=near
   if(near&&sprite.mask!==mask)sprite.setMask({mask,inverse:false})
   if(!near&&sprite.mask)sprite.mask=null
   mask.position.set(position.x,position.y-24)
  }
 }
}
