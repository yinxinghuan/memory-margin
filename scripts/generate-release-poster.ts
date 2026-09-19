import {createHash,randomUUID} from 'node:crypto'
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs'
import {dirname} from 'node:path'
import {submitImageMedia,waitForMediaTask} from './media-service'

const sessionId='b198e25d-5781-48c3-930a-143ed23a92b4'
const ledgerPath='assets/benchmark/release-poster-ledger.json'
const promptBase=`Square key art for a mature pixel-painted near-future 2D exploration RPG about digital immortality and scarce memory storage. A newly uploaded ordinary young adult in a worn deep-indigo coat stands in a quiet orthographic digital apartment; a cyan voice waveform above a small wooden memory box ends in a clean missing gap. Warm lived-in floor and furniture below, restrained dark green terminal infrastructure and subtle magenta data void beyond, uneasy but intimate, coherent premium pixel art, no perspective convergence, no UI, no logos. Keep the bottom 20 percent low-detail and clear for platform controls.`
const jobs=[
 {id:'poster-a',prompt:`${promptBase} At the top safe area, render the exact clear uppercase title MEMORY MARGIN and no other words.`},
 {id:'poster-b',prompt:`${promptBase} Stronger silhouette and clearer missing-waveform focal point at thumbnail size. At the top safe area, render the exact clear uppercase title MEMORY MARGIN and no other words.`},
] as const
type Entry={requestId:string;taskId?:string;status:'pending'|'succeeded'|'failed';url?:string;sha256?:string;output:string;prompt:string;error?:string}
type Ledger={sessionId:string;updatedAt:string;jobs:Record<string,Entry>}
const ledger:Ledger=existsSync(ledgerPath)?JSON.parse(readFileSync(ledgerPath,'utf8')):{sessionId,updatedAt:new Date().toISOString(),jobs:{}}
const save=()=>{ledger.updatedAt=new Date().toISOString();mkdirSync(dirname(ledgerPath),{recursive:true});writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n')}
async function download(url:string,path:string){const response=await fetch(url);if(!response.ok)throw new Error(`download ${response.status}`);const bytes=Buffer.from(await response.arrayBuffer());mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes);return createHash('sha256').update(bytes).digest('hex')}
for(const job of jobs){
 const output=`assets/platform/release/${job.id}.png`
 let entry=ledger.jobs[job.id]
 if(entry?.status==='succeeded'&&existsSync(output))continue
 entry=ledger.jobs[job.id]={requestId:entry?.requestId??randomUUID(),status:'pending',output,prompt:job.prompt};save()
 try{
  const submitted=await submitImageMedia({sessionId,requestId:entry.requestId,mode:'text',prompt:job.prompt,size:{width:1024,height:1024}})
  entry.taskId=submitted.task_id;save()
  const task=submitted.status==='succeeded'?submitted:await waitForMediaTask(submitted,{timeoutMs:20*60_000})
  if(task.media?.type!=='image')throw new Error('poster task returned no image')
  entry.url=task.media.url;entry.sha256=await download(task.media.url,output);entry.status='succeeded';delete entry.error;save()
 }catch(error){entry.status='failed';entry.error=error instanceof Error?error.message:String(error);save();throw error}
}
console.log(ledgerPath)
