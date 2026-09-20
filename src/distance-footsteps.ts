export type FootstepState={distance:number;foot:'left'|'right'}
export function emptyFootstepState():FootstepState{return {distance:0,foot:'left'}}
export function advanceFootsteps(state:FootstepState,actualDistance:number,stride:number,onStep:(foot:'left'|'right')=>void):FootstepState{
 if(!Number.isFinite(actualDistance)||actualDistance<0)throw new Error('actualDistance must be non-negative')
 if(!Number.isFinite(stride)||stride<=0)throw new Error('stride must be positive')
 let distance=state.distance+actualDistance,foot=state.foot
 while(distance>=stride){distance-=stride;onStep(foot);foot=foot==='left'?'right':'left'}
 return {distance,foot}
}
