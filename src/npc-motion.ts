import type {Point} from './spatial/world'

export type NpcFacing='down'|'left'|'right'|'up'
export type NpcMotionState={position:Point;facing:NpcFacing;frame:0|1|2;moving:boolean;attending:boolean}
export type NpcMotionSpec={home:Point;axis:'x'|'y';radius:number;speed:number;restSeconds:number;attentionDistance:number}

const face=(from:Point,to:Point):NpcFacing=>{
 const dx=to.x-from.x,dy=to.y-from.y
 return Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up'
}

/** Cosmetic resident motion with the same contract as the reference game:
 * bounded patrol, a pause at each end, and attention that turns toward the
 * player before conversation opens. Story state never depends on the patrol. */
export class NpcResidentMotion{
 state:NpcMotionState
 private sign=1
 private rest:number
 private stride=0
 constructor(readonly spec:NpcMotionSpec){this.state={position:{...spec.home},facing:'down',frame:1,moving:false,attending:false};this.rest=spec.restSeconds}
 update(dt:number,hero:Point,paused:boolean,selected:boolean,walkable:(point:Point)=>boolean){
  const state=this.state,distance=Math.hypot(hero.x-state.position.x,hero.y-state.position.y)
  state.attending=selected||distance<(state.attending?this.spec.attentionDistance+18:this.spec.attentionDistance)
  if(state.attending){state.moving=false;state.frame=1;this.stride=0;if(distance>1)state.facing=face(state.position,hero);return state}
  if(paused||!Number.isFinite(dt)||dt<=0||dt>.25||this.spec.radius<=0){state.moving=false;state.frame=1;this.stride=0;return state}
  if(this.rest>0){this.rest=Math.max(0,this.rest-dt);state.moving=false;state.frame=1;return state}
  const axis=this.spec.axis,target=this.spec.home[axis]+this.sign*this.spec.radius,remaining=target-state.position[axis]
  const amount=Math.sign(remaining)*Math.min(Math.abs(remaining),this.spec.speed*dt),next={...state.position,[axis]:state.position[axis]+amount}
  if(!walkable(next)){this.sign*=-1;this.rest=this.spec.restSeconds;state.moving=false;state.frame=1;this.stride=0;return state}
  state.position=next;state.moving=Math.abs(amount)>1e-6;state.facing=axis==='x'?(this.sign>0?'right':'left'):(this.sign>0?'down':'up')
  this.stride+=Math.abs(amount);state.frame=(Math.floor(this.stride/5)%2===0?0:2)
  if(Math.abs(remaining)<=Math.abs(amount)+.001){this.sign*=-1;this.rest=this.spec.restSeconds;state.moving=false;state.frame=1;this.stride=0}
  return state
 }
}
