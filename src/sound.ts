export type Cue='approach'|'tap'|'read'|'fracture'|'warning'|'choice'|'reveal'|'complete'|'blocked'
import {advanceFootsteps,emptyFootstepState} from './distance-footsteps'

let audio:AudioContext|undefined
let lastApproach=0
let fracture:HTMLAudioElement|undefined
let ambient:HTMLAudioElement|undefined
let footstepState=emptyFootstepState()
const footsteps:{left?:HTMLAudioElement;right?:HTMLAudioElement}={}

function ensureAmbient(){
 ambient??=new Audio(`${import.meta.env.BASE_URL}audio/memory-margin-ambient.mp3`)
 ambient.loop=true
 ambient.volume=.16
 if(ambient.paused)void ambient.play().catch(()=>{})
}

export function startGameAudio(muted:boolean){
 if(muted||typeof window==='undefined')return
 try{
  ensureAmbient()
  audio??=new AudioContext()
  if(audio.state==='suspended')void audio.resume().catch(()=>{})
 }catch{
  // A denied audio unlock must never block movement or interaction.
 }
}

function playFracture(){
 fracture??=new Audio(`${import.meta.env.BASE_URL}audio/memory-fracture.mp3`)
 fracture.volume=.42
 fracture.currentTime=0
 void fracture.play().catch(()=>{})
}

function playFootstep(foot:'left'|'right'){
 const sample=footsteps[foot]??new Audio(`${import.meta.env.BASE_URL}audio/memory-footstep-${foot}.mp3`)
 footsteps[foot]=sample;sample.volume=.34;sample.currentTime=0;void sample.play().catch(()=>{})
}

export function advanceFootstepAudio(actualDistance:number,muted:boolean){
 footstepState=advanceFootsteps(footstepState,actualDistance,28,foot=>{if(!muted&&typeof window!=='undefined')playFootstep(foot)})
}

export function resetFootstepAudio(){footstepState=emptyFootstepState()}

function tone(ctx:AudioContext,frequency:number,start:number,duration:number,gain:number,type:OscillatorType){
 const oscillator=ctx.createOscillator(),envelope=ctx.createGain()
 oscillator.type=type
 oscillator.frequency.setValueAtTime(frequency,start)
 envelope.gain.setValueAtTime(0,start)
 envelope.gain.linearRampToValueAtTime(gain,start+.012)
 envelope.gain.exponentialRampToValueAtTime(.0001,start+duration)
 oscillator.connect(envelope).connect(ctx.destination)
 oscillator.start(start)
 oscillator.stop(start+duration+.02)
}

export function playCue(cue:Cue,muted:boolean){
 if(muted||typeof window==='undefined')return
 try{
  startGameAudio(false)
  if(cue==='approach'&&performance.now()-lastApproach<160)return
  if(cue==='approach')lastApproach=performance.now()
  audio??=new AudioContext()
  const now=audio.currentTime+.015
  switch(cue){
   case 'approach':tone(audio,260,now,.07,.013,'sine');break
   case 'tap':tone(audio,330,now,.055,.018,'triangle');break
   case 'read':tone(audio,392,now,.11,.032,'sine');tone(audio,523,now+.055,.14,.022,'sine');break
   case 'fracture':playFracture();break
   case 'warning':tone(audio,262,now,.16,.035,'triangle');tone(audio,208,now+.11,.22,.025,'sine');break
   case 'choice':tone(audio,196,now,.26,.04,'triangle');tone(audio,294,now+.13,.31,.032,'sine');break
   case 'reveal':tone(audio,311,now,.11,.035,'triangle');tone(audio,233,now+.11,.18,.026,'triangle');tone(audio,349,now+.23,.25,.025,'sine');break
   case 'complete':tone(audio,220,now,.27,.032,'triangle');tone(audio,330,now+.12,.32,.028,'sine');tone(audio,440,now+.25,.38,.026,'sine');break
   case 'blocked':tone(audio,180,now,.09,.028,'triangle');break
  }
 }catch{
  // Audio availability must never block a story action.
 }
}

export function setSoundMuted(muted:boolean){
 if(!muted)return
 if(fracture){fracture.pause();fracture.currentTime=0}
 ambient?.pause()
 for(const sample of Object.values(footsteps)){sample?.pause();if(sample)sample.currentTime=0}
}
