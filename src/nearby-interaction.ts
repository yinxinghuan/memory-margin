import type {Point} from './spatial/world'

type Focusable={id:string;approach:Point}

/**
 * Keep one nearby interaction target stable while the actor moves between
 * overlapping trigger zones. A clicked target wins while it remains valid;
 * otherwise the previous target is retained until another is clearly closer.
 */
export function stableNearby<T extends Focusable>(
 entities:readonly T[],
 position:Point,
 isNear:(entity:T)=>boolean,
 previousId?:string,
 preferredId?:string,
 hysteresis=8,
):T|undefined{
 const candidates=entities
  .filter(isNear)
  .map(entity=>({entity,distance:Math.hypot(entity.approach.x-position.x,entity.approach.y-position.y)}))
  .sort((a,b)=>a.distance-b.distance)
 const preferred=candidates.find(item=>item.entity.id===preferredId)
 if(preferred)return preferred.entity
 const nearest=candidates[0]
 const previous=candidates.find(item=>item.entity.id===previousId)
 if(previous&&nearest&&previous.distance-nearest.distance<hysteresis)return previous.entity
 return nearest?.entity
}

export function interactionVerb(kind:string,locale:'zh'|'en'){
 if(kind==='door')return locale==='zh'?'前往':'Enter'
 if(kind==='person')return locale==='zh'?'交谈':'Talk'
 return locale==='zh'?'查看':'Inspect'
}

export type PrimaryInteractionIntent='inactive'|'close-panel'|'enter-door'|'open-panel'

/** The map hotspot never opens content. Only the persistent primary action does. */
export function primaryInteractionIntent(kind:string|undefined,panelOpen:boolean):PrimaryInteractionIntent{
 if(panelOpen)return 'close-panel'
 if(!kind)return 'inactive'
 return kind==='door'?'enter-door':'open-panel'
}
