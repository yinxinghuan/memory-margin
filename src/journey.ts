import {initialStory,applyAction,type StorySave,type Locale,t} from './story'
import {entities,portals,type EntityId,type Scene,world} from './world'
import {walkable,type Point} from './spatial/world'

export type Head={version:number;scene:Scene;position:Point;save:StorySave}
export type Action={id:string;version:number;scene:Scene;entity:EntityId;action:string;position:Point}
export type Result={head:Head;text:string;accepted:boolean}

export function initialHead(locale:Locale):Head{return {version:0,scene:'home',position:{...world.scenes.home.spawn},save:initialStory(locale)}}
export function resolveAction(head:Head,request:Action):Result{
 if(!/^[\w-]{16,80}$/.test(request.id))throw new Error('INVALID_ACTION_ID')
 if(request.version!==head.version)throw new Error('VERSION_CONFLICT')
 const entity=entities[request.entity]
 if(!entity||head.scene!==request.scene||entity.scene!==head.scene||!entity.actions.includes(request.action))throw new Error('ACTION_OUTSIDE_CONTRACT')
 if(!walkable(world,head.scene,request.position)||Math.hypot(request.position.x-entity.approach.x,request.position.y-entity.approach.y)>26)throw new Error('MOVE_CLOSER')
 const result=applyAction(head.save,request.action)
 if(!result.accepted)return {head,text:result.text,accepted:false}
 const destination=portals[request.action]
 return {head:{version:head.version+1,scene:destination?.scene??head.scene,position:destination?{...destination.position}:{...request.position},save:result.save},text:result.text,accepted:true}
}

// Free text, if added later, may propose only a prepared action; it cannot execute or create a new object.
export function admitProposal(head:Head,entityId:EntityId,proposal:{scene:string;entityIds:string[];action?:string;text:string}){
 const entity=entities[entityId]
 if(!entity||entity.scene!==head.scene||proposal.scene!==head.scene||!proposal.entityIds.includes(entityId)||proposal.entityIds.some(id=>!Object.hasOwn(entities,id)||entities[id as EntityId].scene!==head.scene))throw new Error('UNPREPARED_ASSET')
 if(proposal.action&&!entity.actions.includes(proposal.action))throw new Error('UNSUPPORTED_ACTION')
 return {...proposal,requiresConfirmation:Boolean(proposal.action),message:t(head.save.locale,'请在场景中确认这个行动。','Confirm this action in the scene.')}
}
