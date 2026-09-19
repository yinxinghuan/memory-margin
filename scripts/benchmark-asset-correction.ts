import {createHash,randomUUID} from 'node:crypto'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {dirname} from 'node:path'
import {generateImageMedia,MediaServiceError} from './media-service'

const sessionId='b198e25d-5781-48c3-930a-143ed23a92b4'
const first=JSON.parse(await readFile('assets/asset-generation-benchmark.json','utf8')) as {results:Array<{id:string;status:string;url?:string}>}
const url=(id:string)=>{const value=first.results.find(result=>result.id===id)?.url;if(!value)throw new Error(`MISSING_FIRST_PASS:${id}`);return value}
const jobs=[
 {id:'memory-exchange-bench-v2',referenceUrl:url('memory-exchange-bench'),output:'assets/benchmark/memory-exchange-bench-v2.png',prompt:'CAMERA AND PROPORTION CORRECTION ONLY. Preserve this exact two-seat bench identity, graphite frame, two worn teal cushions, brass charging rail, cable, color palette and mature pixel-painted detail. Re-render it from a MUCH STEEPER B-VIEW ORTHOGRAPHIC game camera, looking mostly down from above. The two seat TOP SURFACES must dominate. Compress every vertical leg and front face to about one third of its current visible height; total bench height becomes about 70 pixels while width remains about 190 pixels for an adult about 105 pixels tall. Both spatial edge families remain parallel with zero convergence and no near-side enlargement. Keep the 45-degree floor orientation, but do not use a low product-photo camera. One complete bench centered on pure uniform RGB #FF00FF. No person, floor, wall, text, logo, extra object, cast shadow or redesign.'},
 {id:'memory-quarantine-locker-v2',referenceUrl:url('memory-quarantine-locker'),output:'assets/benchmark/memory-quarantine-locker-v2.png',prompt:'CAMERA AND FORM CORRECTION ONLY. Preserve the graphite/brass quarantine-device identity, three blank wafer windows, amber isolation indicator, cyan slit and two sealed bays. Replace the current tall frontal cabinet proportions with a LOW WAIST-HIGH QUARANTINE BUFFER seen from a steep B-view orthographic game camera. The broad rectangular TOP SURFACE occupies at least 70 percent of the visible object height; the front face is a very short band no more than 22 percent. Top and bottom edges exactly equal, side edges parallel, zero convergence, no trapezoid. Two sealed bays become shallow horizontal drawers in the short front band. For an adult about 105 pixels tall, object width about 120 pixels and visible height about 65 pixels. Center one complete device on pure uniform RGB #FF00FF. No upright doors, tall cabinet, desk, person, floor, wall, text, glyphs, hologram, cast shadow, product-photo camera or other redesign.'},
] as const

const startedAt=new Date().toISOString(),batchStart=performance.now()
const results=await Promise.all(jobs.map(async job=>{
 const requestId=randomUUID(),start=performance.now()
 try{
  const task=await generateImageMedia({sessionId,requestId,mode:'edit',prompt:job.prompt,referenceUrls:[job.referenceUrl],size:{width:512,height:512}})
  const generatedAt=performance.now(),response=await fetch(task.media.url)
  if(!response.ok)throw new Error(`DOWNLOAD_HTTP_${response.status}`)
  const bytes=Buffer.from(await response.arrayBuffer()),downloadedAt=performance.now()
  await mkdir(dirname(job.output),{recursive:true});await writeFile(job.output,bytes)
  return {id:job.id,status:'succeeded' as const,requestId,taskId:task.task_id,url:task.media.url,output:job.output,size:[task.media.width,task.media.height],serviceTimingMs:task.timing_ms??null,generationMs:Math.round(generatedAt-start),downloadMs:Math.round(downloadedAt-generatedAt),totalMs:Math.round(downloadedAt-start),sha256:createHash('sha256').update(bytes).digest('hex'),prompt:job.prompt}
 }catch(error){const e=error as Error;return {id:job.id,status:'failed' as const,requestId,totalMs:Math.round(performance.now()-start),error:e instanceof MediaServiceError?{code:e.code,message:e.message,retryable:e.retryable,retryAfterSeconds:e.retryAfterSeconds}:{code:'LOCAL_ERROR',message:e.message,retryable:false},prompt:job.prompt}}
}))
const report={version:1,mode:'parallel-camera-corrections',sessionId,startedAt,endedAt:new Date().toISOString(),wallClockMs:Math.round(performance.now()-batchStart),concurrency:jobs.length,results}
await writeFile('assets/asset-generation-correction-benchmark.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report))
if(results.some(result=>result.status==='failed'))process.exitCode=1
