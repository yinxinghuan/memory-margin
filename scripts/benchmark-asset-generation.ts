import {createHash,randomUUID} from 'node:crypto'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {dirname} from 'node:path'
import {generateImageMedia,MediaServiceError} from './media-service'

const sessionId='b198e25d-5781-48c3-930a-143ed23a92b4'
const outputManifest='assets/asset-generation-benchmark.json'
const platformManifest=JSON.parse(await readFile('assets/platform-media.json','utf8')) as {jobs:Record<string,{url?:string;status:string}>}
const referenceUrl=platformManifest.jobs['service-console-v6']?.url
if(!referenceUrl)throw new Error('MISSING_ACCEPTED_STYLE_REFERENCE')

const jobs=[
 {
  id:'memory-exchange-bench',
  output:'assets/benchmark/memory-exchange-bench.png',
  prompt:'NEW OBJECT GENERATION. Use the reference only for mature pixel-painted material, restrained graphite/brass/teal palette, cyan practical indicators, steep B-view orthographic camera and world scale. Create ONE complete two-person PUBLIC MEMORY EXCHANGE WAITING BENCH, a genuinely new silhouette: slim dark graphite frame, two separate worn teal conductive seat cushions, low shared back rail, one narrow brass charging rail between the seats, and a short fiber cable coiled beside the rear foot. Turn the bench 45 degrees on the floor while keeping strict orthographic projection: both spatial edge families parallel, no convergence, no near-side enlargement. Broad seat surfaces and extremely short front faces. A standing adult at this scale would be about 105 pixels tall; bench total visible width about 190 pixels and seat height about 45 pixels. Center one full object on pure uniform RGB #FF00FF. No reuse of the reference console silhouette, no person, floor, wall, text, logo, hologram, cast shadow, product photo or perspective.'
 },
 {
  id:'memory-quarantine-locker',
  output:'assets/benchmark/memory-quarantine-locker.png',
  prompt:'NEW OBJECT GENERATION. Use the reference only for its mature pixel-painted graphite, aged brass, desaturated teal and restrained cyan visual language plus the same steep B-view orthographic game camera. Create ONE complete freestanding MEMORY QUARANTINE LOCKER, a new compact cabinet about chest-high to an adult: rectangular axis-aligned top plane with equal opposite edges, short visible front face, two sealed dark doors, three small blank translucent wafer windows inset into the top, one amber isolation indicator and one narrow cyan status slit. A standing adult at this scale is about 105 pixels tall; this locker appears about 85 pixels tall and 110 pixels wide. Keep all horizontal and vertical edge families parallel with zero convergence. Center one complete object on pure uniform RGB #FF00FF. No console, desk, chair, person, floor, wall, readable text, glyphs, hologram, dramatic glow, cast shadow, product photography or trapezoid perspective.'
 },
 {
  id:'memory-maintenance-drone',
  output:'assets/benchmark/memory-maintenance-drone.png',
  prompt:'NEW OBJECT GENERATION. Use the reference only for mature crisp pixel-painted detail, worn graphite/brass/teal materials, tiny cyan indicators, upper-left light and the same steep B-view orthographic game projection. Create ONE complete LOW MOBILE MEMORY-MAINTENANCE DRONE, a new rounded rectangular floor robot with a broad top service hatch, two small recessed tool bays, four tiny covered wheels, one folded diagnostic arm lying flat against the top, and a short trailing dark fiber lead. It is practical used civic equipment, not cute or anthropomorphic. A standing adult is about 105 pixels tall; drone footprint about 95 by 70 pixels and body height only 25 pixels. Show mostly top surface and an extremely short front face, parallel edges, no near-side enlargement. Center one complete object on pure uniform RGB #FF00FF. No reuse of the console silhouette, no eyes, face, person, floor, wall, text, logo, hologram, cast shadow, product photo, isometric exaggeration or perspective convergence.'
 },
] as const

const startedAt=new Date().toISOString(),batchStart=performance.now()
const results=await Promise.all(jobs.map(async job=>{
 const requestId=randomUUID(),start=performance.now()
 try{
  const task=await generateImageMedia({sessionId,requestId,mode:'edit',prompt:job.prompt,referenceUrls:[referenceUrl],size:{width:512,height:512}})
  const generatedAt=performance.now(),response=await fetch(task.media.url)
  if(!response.ok)throw new Error(`DOWNLOAD_HTTP_${response.status}`)
  const bytes=Buffer.from(await response.arrayBuffer()),downloadedAt=performance.now()
  await mkdir(dirname(job.output),{recursive:true});await writeFile(job.output,bytes)
  return {id:job.id,status:'succeeded' as const,requestId,taskId:task.task_id,url:task.media.url,output:job.output,size:[task.media.width,task.media.height],serviceTimingMs:task.timing_ms??null,generationMs:Math.round(generatedAt-start),downloadMs:Math.round(downloadedAt-generatedAt),totalMs:Math.round(downloadedAt-start),sha256:createHash('sha256').update(bytes).digest('hex'),prompt:job.prompt}
 }catch(error){
  const e=error as Error,failedAt=performance.now()
  return {id:job.id,status:'failed' as const,requestId,totalMs:Math.round(failedAt-start),error:e instanceof MediaServiceError?{code:e.code,message:e.message,retryable:e.retryable,retryAfterSeconds:e.retryAfterSeconds}: {code:'LOCAL_ERROR',message:e.message,retryable:false},prompt:job.prompt}
 }
}))
const endedAt=new Date().toISOString(),report={version:1,mode:'parallel-independent-assets',sessionId,referenceJob:'service-console-v6',startedAt,endedAt,wallClockMs:Math.round(performance.now()-batchStart),concurrency:jobs.length,results}
await writeFile(outputManifest,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report))
if(results.some(result=>result.status==='failed'))process.exitCode=1
