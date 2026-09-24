import {initialHead} from '../src/journey'
import {requestDialogue} from '../src/free-dialogue'
import {writeFile} from 'node:fs/promises'
const head=initialHead('en');head.save.facts.neighborMet=true
const started=Date.now(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000)
try{const reply=await requestDialogue(head,'neighbor','What small thing helps you feel at home here?',controller.signal);await writeFile('_qa/rebuild-20260924/dialogue/live-response.json',JSON.stringify({time:new Date().toISOString(),elapsedMs:Date.now()-started,input:'What small thing helps you feel at home here?',reply,locale:'en',mutatesStory:false},null,2));console.log(reply)}finally{clearTimeout(timer)}
