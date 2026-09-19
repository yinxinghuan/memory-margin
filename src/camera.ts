import type {Point} from './spatial/world'

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))

/** Presentation only. World coordinates, collision and interaction ranges stay unchanged. */
export function mapCamera(view:{width:number;height:number},feet:Point){
 const scale=clamp(view.width/320,1.05,1.22)
 const width=384*scale,height=512*scale
 const x=width<=view.width?(view.width-width)/2:clamp(view.width/2-(feet.x+4.5)*scale,view.width-width,0)
 const y=height<=view.height?(view.height-height)/2:clamp(view.height*.72-(feet.y+15)*scale,view.height-height,0)
 return {x,y,scale,width,height}
}
