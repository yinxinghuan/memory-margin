import {Direction} from '@rpgjs/common'
import {startGame,provideClientGlobalConfig,provideClientModules,provideRpg,type RpgClientEngine} from '@rpgjs/client'
import {createServer,provideServerModules,type RpgPlayer} from '@rpgjs/server'
import {provideTiledMap as tiledClient} from '@rpgjs/tiledmap/client'
import {provideTiledMap as tiledServer} from '@rpgjs/tiledmap/server'
import {advanceRoute,moveWithCollision,createDistancePoseSelector} from './distance-motion'
import {walkable,findPath,type World,type Point} from './world'

export type Space={position:()=>Point;scene:()=>string;renderedScene:()=>string|null;move:(x:number,y:number)=>void;walkTo:(target:Point,arrive?:()=>void)=>boolean;pause:(v:boolean)=>void;restore:(scene:string,position:Point)=>Promise<void>}
export type SpaceOptions={world:World;host:HTMLElement;scene:string;position:Point;speed:number;stride:number;poses:string[];sheet:any;onPosition:(p:Point)=>void;onTravel?:(actualDistance:number)=>void;onDestination:(p:Point|null)=>void;onReady:(space:Space)=>void;onError:(error:unknown)=>void}

// RPG-JS adapter only: the caller owns story, UI, persistence, art and input bindings.
export function createRpgSpace(options:SpaceOptions){
 if(options.host.id!=='rpg')throw new Error('RPG_MOUNT_ID_REQUIRED')
 const {world,host}=options,ids=Object.keys(world.scenes),poseAt=createDistancePoseSelector(options.stride,options.poses)
 let scene=options.scene,pos={...options.position},client:RpgClientEngine|undefined,player:RpgPlayer|undefined
 let loaded:string|null=null,joined:string|null=null,paused=true,changing=false,last=0,stride=0,stick={x:0,y:0},route:Point[]=[],arrive:(()=>void)|undefined
 const checks=new Set<()=>void>()
 const wait=(id:string)=>new Promise<void>((resolve,reject)=>{const check=()=>{if(loaded===id&&joined===id){clearTimeout(timer);checks.delete(check);resolve()}};const timer=setTimeout(()=>{checks.delete(check);reject(new Error('MAP_LOAD_TIMEOUT'))},12000);checks.add(check);check()})
 const cancel=()=>{route=[];arrive=undefined;options.onDestination(null)}
 const project=()=>{const sprite=client?.getCurrentPlayer();if(!sprite||!player)return;sprite.animationFixed=true;if(sprite.x()!==pos.x)sprite.x.set(pos.x);if(sprite.y()!==pos.y)sprite.y.set(pos.y);if(sprite.direction()!==player.direction())sprite.direction.set(player.direction());if(sprite.animationName()!==player.animationName())sprite.animationName.set(player.animationName())}
 const stand=()=>{stride=0;if(player&&player.animationName()!=='stand')player.animationName.set('stand');project()}
 const resolution=()=>Math.min(4,Math.max(1,Math.ceil(host.parentElement!.clientWidth/world.width*(devicePixelRatio||1)*4)/4))
 const resize=()=>{host.style.transform=`scale(${host.parentElement!.clientWidth/world.width})`;if(client?.renderer){client.renderer.resize(world.width,world.height,resolution())}}
 const observer=new ResizeObserver(resize);observer.observe(host.parentElement!);resize()
 const runtime:Space={position:()=>({...pos}),scene:()=>scene,renderedScene:()=>loaded,
  move:(x,y)=>{stick={x,y};if(x||y)cancel()},
  walkTo:(target,callback)=>{if(paused||changing)return false;const next=findPath(world,scene,pos,target);if(!next.length)return false;route=next;arrive=callback;options.onDestination(target);return true},
  pause:v=>{paused=v;stick={x:0,y:0};if(v){cancel();stand()}},
  restore:async(next,p)=>{if(!walkable(world,next,p))throw new Error('INVALID_ARRIVAL');changing=true;cancel();stick={x:0,y:0};stand();try{await wait(scene);if(next!==scene){loaded=null;const changed=await player!.changeMap(next,p);if(!changed)throw new Error('MAP_CHANGE_REJECTED');await wait(next)}else await player!.teleport(p);scene=next;pos={...p};player!.syncChanges();project();options.onPosition(pos)}finally{changing=false}},
 }
 const server=createServer({providers:[tiledServer(),provideServerModules([{player:{onJoinMap(p,map){player=p;p.setGraphic(options.sheet.id);p.setHitbox(world.actor.w,world.actor.h);p.animationFixed=true;joined=map.id.replace(/^map-/,'');checks.forEach(fn=>fn())},async onConnected(p){player=p;try{p.setGraphic(options.sheet.id);p.setHitbox(world.actor.w,world.actor.h);p.animationFixed=true;await p.changeMap(scene,pos);// Do not await renderer readiness inside onConnected: the client join handshake needs this hook to return.
void wait(scene).then(()=>{project();options.onReady(runtime)}).catch(options.onError)}catch(e){options.onError(e)}}},maps:ids.map(id=>({id,events:[]}))}])]})
 startGame({providers:[provideClientGlobalConfig({prediction:{enabled:false},bootstrapCanvasOptions:{antialias:false,backgroundAlpha:0,autoDensity:true,resolution:resolution()}}),tiledClient({basePath:'./map'}),provideClientModules([{spritesheets:[options.sheet],sceneMap:{onAfterLoading(){loaded=client?.activeRoom()?.name?.replace(/^map-/,'')??null;checks.forEach(fn=>fn())}},engine:{onStart(engine){client=engine;engine.width.set(String(world.width));engine.height.set(String(world.height));engine.stopProcessingInput=true;engine.renderer.background.alpha=0;resize()}}}]),provideRpg(server)]})
 const tick=(time:number)=>{
  const dt=last?Math.min(Math.max(0,(time-last)/1000),.04):0;last=time
  if(player&&!paused&&!changing){
   let x=stick.x,y=stick.y,distance=0,finished=false;const len=Math.hypot(x,y);if(len>1){x/=len;y/=len}
   const clear=(p:Point)=>walkable(world,scene,p)
   if(!x&&!y&&route.length){const r=advanceRoute(pos,route,options.speed*dt,clear);pos=r.position;distance=r.distance;x=r.direction.x;y=r.direction.y;route.splice(0,r.consumed);finished=r.arrived;if(r.blocked)cancel()}
   else if(x||y){const r=moveWithCollision(pos,{x:x*options.speed*dt,y:y*options.speed*dt},clear);x=r.position.x-pos.x;y=r.position.y-pos.y;pos=r.position;distance=r.distance}
   if(distance>1e-7){stride=(stride+distance)%options.stride;const pose=poseAt(stride);if(player.animationName()!==pose)player.animationName.set(pose);player.direction.set(Math.abs(x)>Math.abs(y)?(x>0?Direction.Right:Direction.Left):(y>0?Direction.Down:Direction.Up));void player.teleport(pos);player.syncChanges();options.onTravel?.(distance);options.onPosition(pos)}else stand()
   if(finished){const callback=arrive;arrive=undefined;options.onDestination(null);stand();callback?.()}
  }
  project();requestAnimationFrame(tick)
 }
 requestAnimationFrame(tick)
 return runtime
}
