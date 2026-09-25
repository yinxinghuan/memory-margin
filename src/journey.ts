import {resolveDomainAction,applyDomainResolution} from './vendor/story/engine/domainRules'
import {initialStory,applyAction,cartridge,migrateStorySave,type StorySave,type Locale,t} from './story'
import {entities,entityNear,portals,type EntityId,type Scene,world} from './world'
import {walkable,type Point} from './spatial/world'
import {emptyConversationHistory,type ConversationHistory} from './conversation-history'

export type Head={version:number;scene:Scene;position:Point;save:StorySave;conversationHistory:ConversationHistory}
export type Action={id:string;version:number;scene:Scene;entity:EntityId;action:string;position:Point}
export type Result={head:Head;text:string;accepted:boolean}

export function initialHead(locale:Locale):Head{return {version:0,scene:'home',position:{...world.scenes.home.spawn},save:initialStory(locale),conversationHistory:emptyConversationHistory()}}
export function migrateHead(head:Head):Head{
 const save=migrateStorySave(head.save),history=(head as Partial<Head>).conversationHistory
 if(save===head.save&&history?.version===1&&Array.isArray(history.turns))return head
 return {...head,save,conversationHistory:history?.version===1&&Array.isArray(history.turns)?history:emptyConversationHistory()}
}
export function resolveAction(head:Head,request:Action):Result{
 head=migrateHead(head)
 if(!/^[\w-]{16,80}$/.test(request.id))throw new Error('INVALID_ACTION_ID')
 if(request.version!==head.version)throw new Error('VERSION_CONFLICT')
 if(request.action.startsWith('map-travel:')){
  const target=request.action.slice(11) as Scene,known=new Set(head.save.map.filter(n=>n.visited||n.current).map(n=>n.id))
  if(request.scene!==head.scene||!walkable(world,head.scene,request.position))throw new Error('ACTION_OUTSIDE_CONTRACT')
  if(!Object.hasOwn(world.scenes,target)||target===head.scene||!known.has(target))return {head,text:t(head.save.locale,'首次到访后才能快捷前往。','Visit this room first to unlock quick travel.'),accepted:false}
  const queue:Scene[][]=[[head.scene]],seen=new Set<Scene>([head.scene]);let route:Scene[]|undefined
  while(queue.length){const path=queue.shift()!,from=path.at(-1)!;if(from===target){route=path;break}for(const door of Object.values(portals).filter(d=>d.from===from)){if(known.has(door.scene)&&!seen.has(door.scene)){seen.add(door.scene);queue.push([...path,door.scene])}}}
  if(!route)return {head,text:t(head.save.locale,'没有已开放的路线。','No open route.'),accepted:false}
  const save=structuredClone(head.save),c=cartridge(save.locale);let position={...request.position}
  for(let i=1;i<route.length;i++){
   const edge=Object.entries(portals).find(([,d])=>d.from===route![i-1]&&d.scene===route![i])!,resolution=resolveDomainAction(save,c,edge[0])
   if(!resolution||resolution.status!=='accepted')return {head,text:t(save.locale,'这条路线暂时无法通行。','This route is currently blocked.'),accepted:false}
   const rules=c.domainRules!.rules.filter(r=>r.id===edge[0]);if(rules.length!==1||rules[0].effects.some(e=>e.type!=='map'))throw new Error('ACTION_OUTSIDE_CONTRACT')
   applyDomainResolution(save,{...c,domainRules:{rules}},resolution);position={...edge[1].position}
  }
  save.choices=structuredClone(head.save.choices)
  if(!walkable(world,target,position))throw new Error('ACTION_OUTSIDE_CONTRACT')
  return {head:{...head,version:head.version+1,scene:target,position,save},text:t(save.locale,'已抵达。','Arrived.'),accepted:true}
 }
 const entity=entities[request.entity]
 if(!entity||head.scene!==request.scene||entity.scene!==head.scene||!entity.actions.includes(request.action))throw new Error('ACTION_OUTSIDE_CONTRACT')
 if(!walkable(world,head.scene,request.position)||!entityNear(entity,request.position))throw new Error('MOVE_CLOSER')
 const result=applyAction(head.save,request.action)
 if(!result.accepted)return {head,text:result.text,accepted:false}
 const destination=portals[request.action]
 return {head:{version:head.version+1,scene:destination?.scene??head.scene,position:destination?{...destination.position}:{...request.position},save:result.save,conversationHistory:head.conversationHistory},text:result.text,accepted:true}
}

// Free text, if added later, may propose only a prepared action; it cannot execute or create a new object.
export function admitProposal(head:Head,entityId:EntityId,proposal:{scene:string;entityIds:string[];action?:string;text:string}){
 const entity=entities[entityId]
 if(!entity||entity.scene!==head.scene||proposal.scene!==head.scene||!proposal.entityIds.includes(entityId)||proposal.entityIds.some(id=>!Object.hasOwn(entities,id)||entities[id as EntityId].scene!==head.scene))throw new Error('UNPREPARED_ASSET')
 if(proposal.action&&!entity.actions.includes(proposal.action))throw new Error('UNSUPPORTED_ACTION')
 return {...proposal,requiresConfirmation:Boolean(proposal.action),message:t(head.save.locale,'请在场景中确认这个行动。','Confirm this action in the scene.')}
}
