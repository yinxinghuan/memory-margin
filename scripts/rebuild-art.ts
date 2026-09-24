import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import {generateImageMedia} from './media-service'
const root='doc/rebuild-20260924/art'
await mkdir(root,{recursive:true})
const health=await fetch('https://game.aiwaves.tech/alteru-media/api/health').then(r=>r.json())
await writeFile(`${root}/health.json`,JSON.stringify(health,null,2))
const style='Restrained chunky 16-bit pixel art, crisp clustered pixels, dark graphite outlines, muted petrol teal and warm amber accents, consistent soft upper-left light. Not photorealistic, no text, no watermark.'
const jobs=[
 {id:'hero-root',prompt:`${style} One full-body ordinary newly uploaded adult aged 30, short charcoal hair, muted ochre cropped utility jacket over dark teal shirt, straight graphite trousers, simple dark shoes, no bag, no handheld objects. Quiet determination, mature adult proportions about 5 heads tall, not child or chibi. Elevated ORTHOGRAPHIC camera looking down 50 degrees, zero sideways yaw. Facing south toward viewer, see crown of head and tops of shoulders, naturally standing with both feet parallel and arms relaxed. Entire body, clean silhouette, centered, occupies 78 percent of height. Pure solid #FF00FF background, no ground plane, no shadow. Single pose, no sprite sheet.`},
 {id:'home-floor',prompt:`${style} Seamless flat TOP DOWN orthographic floor texture only, edge to edge. Equal scale everywhere, parallel straight seams. Square muted gray-green modular floor tiles, restrained worn grout, small industrial access joints, subtle lived-in scuffs, almost uniform lighting. No wall, furniture, object, border, symbols, perspective taper, cast shadow or lighting gradient. Suitable for a near-future digital residence, subtle cyberpunk not hospital.`},
 {id:'voice-console',prompt:`${style} One low personal memory playback console, two short sturdy supports, graphite casing with worn brass corners, a narrow cyan waveform display recessed in the top surface and a single amber memory cartridge physically resting in its dock. Human-scale bedside device, wide and low, not a giant server. Elevated ORTHOGRAPHIC camera looking down 50 degrees, zero sideways yaw. Front and back tabletop edges equal length and horizontal; depth edges vertical in the image. Rectangular top plane, no trapezoid, no vanishing point. One complete object, dark outline, no floor, wall or cast shadow. Pure solid #FF00FF background, centered with generous margins. No labels or letters.`},
]
for(const job of jobs){
 const recordPath=`${root}/${job.id}.json`
 let record:any
 try{record=JSON.parse(await readFile(recordPath,'utf8'))}catch{record={id:job.id,requestId:randomUUID(),prompt:job.prompt,mode:'text',referenceUrls:[],model:'gpt-image-2.5-sunburst',quality:'high',background:'opaque',status:'prepared'};await writeFile(recordPath,JSON.stringify(record,null,2))}
 if(record.status==='downloaded'){console.log(`${job.id}: already downloaded`);continue}
 try{
  const started=Date.now()
  const result=record.result??await generateImageMedia({sessionId:'b198e25d-5781-48c3-930a-143ed23a92b4',requestId:record.requestId,mode:'text',prompt:record.prompt,referenceUrls:[],model:record.model,quality:'high',background:'opaque',size:{width:1024,height:1024}})
  record.result=result;record.elapsedMs=Date.now()-started;record.status='generated';await writeFile(recordPath,JSON.stringify(record,null,2))
  const response=await fetch(result.media.url);if(!response.ok)throw new Error(`download ${response.status}`)
  const bytes=Buffer.from(await response.arrayBuffer());await writeFile(`${root}/${job.id}.webp`,bytes)
  record.sha256=createHash('sha256').update(bytes).digest('hex');record.status='downloaded';record.visualQA='pending';await writeFile(recordPath,JSON.stringify(record,null,2));console.log(`${job.id}: downloaded in ${record.elapsedMs}ms`)
 }catch(error){record.error=String(error);await writeFile(recordPath,JSON.stringify(record,null,2));console.error(job.id,record.error);process.exitCode=1;break}
}
