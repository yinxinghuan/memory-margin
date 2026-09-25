import {Assets,Sprite,Texture,type Container} from 'pixi.js'
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

// Cached soft alpha texture, shared by wall segments; walking only moves masks.
export function createForegroundReveal(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024
 const ctx=canvas.getContext('2d')!,gradient=ctx.createRadialGradient(512,512,0,512,512,48)
 gradient.addColorStop(0,'rgba(255,255,255,.2)');gradient.addColorStop(.58,'rgba(255,255,255,.2)');gradient.addColorStop(1,'white')
 ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,1024)
 const texture=Texture.from(canvas);texture.source.scaleMode='linear'
 let active='',nextScan=0
 let masks:{sprite:Sprite;mask:Sprite;layer:typeof layers[number]}[]=[]
 return (client:any,scene:string,position:{x:number;y:number})=>{
  const now=performance.now()
  if(active!==scene){for(const {sprite,mask} of masks){if(!sprite.destroyed)sprite.mask=null;if(!mask.destroyed)mask.destroy()}masks=[];active=scene;nextScan=0}
  if(now>=nextScan){
   nextScan=now+500
   const room=world.scenes[scene]
   const fronts=layers.filter(l=>l.scene===scene&&l.id.includes('-front-')&&l.y>=room.interior.y+room.interior.h-80&&!Object.values(entities).some(e=>e.scene===scene&&e.kind==='door'&&e.side==='S'&&Math.abs(l.x-e.visual.x)<1&&Math.abs(l.width*l.scale-e.visual.w)<1))
   const visit=(node:Container)=>{
    const sprite=node as Sprite,label=sprite.texture?.source?.label
    const layer=typeof label==='string'?fronts.find(l=>label.includes(l.image.replace('./','/'))):undefined
    if(layer&&!masks.some(m=>m.sprite===sprite)&&sprite.parent){
     const mask=new Sprite({texture});mask.anchor.set(.5);mask.label='mm-soft-foreground-reveal';sprite.parent.addChild(mask);mask.visible=false;masks.push({sprite,mask,layer})
    }
    for(const child of [...(node.children??[])])visit(child)
   }
   if(client.canvasApp?.stage)visit(client.canvasApp.stage)
   masks=masks.filter(m=>!m.sprite.destroyed&&!m.mask.destroyed)
  }
  const center={x:position.x,y:position.y-28}
  for(const {sprite,mask,layer} of masks){
   const near=center.x+48>layer.x&&center.x-48<layer.x+layer.width*layer.scale&&center.y+48>layer.y&&center.y-48<layer.y+layer.height*layer.scale
   mask.visible=near
   if(!near){if(sprite.mask)sprite.mask=null;continue}
   // Cropped wall textures have their own origin and render scale.
   mask.scale.set(sprite.scale.x/layer.scale,sprite.scale.y/layer.scale)
   mask.position.set(sprite.x+((center.x-layer.x)/layer.scale-sprite.anchor.x*layer.width)*sprite.scale.x,sprite.y+((center.y-layer.y)/layer.scale-sprite.anchor.y*layer.height)*sprite.scale.y)
   if(sprite.mask!==mask)sprite.setMask({mask,inverse:false})
  }
 }
}
