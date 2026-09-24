import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import {generateImageMedia} from './media-service'
const root='doc/rebuild-20260924/art'
await mkdir(root,{recursive:true})
const health=await fetch('https://game.aiwaves.tech/alteru-media/api/health').then(r=>r.json())
await writeFile(`${root}/health.json`,JSON.stringify(health,null,2))
const style='Restrained chunky 16-bit pixel art, crisp clustered pixels, dark graphite outlines, muted petrol teal and warm amber accents, consistent soft upper-left light. Not photorealistic, no text, no watermark.'
const jobs=[
 {id:'door-front-root',prompt:`${style} One independent metal panel with small door hardware. Geometry first: its visible main face is a 420 pixels wide by 540 pixels tall RECTANGLE; its OWN narrow top thickness is visible as a 420 by 24 pixel rectangle, directly above and flush with that face. No separate lintel, header, frame or border around the object. It is the leaf of an ordinary apartment door, in worn graphite teal metal with a single thin brass inset line and a small amber key socket. Elevated orthographic camera looking downward 50 degrees, zero horizontal yaw. This is a tall vertical real-world slab foreshortened by the elevated camera. All vertical edges parallel. The real circular plate behind the small horizontal lever appears as a shallow horizontal ellipse because of the downward view; see top surfaces of the lever and hinge barrels. Small lever at LEFT, hinge barrels RIGHT, hardware much smaller than a person's hand. No wall, room, floor, threshold, fixed doorframe, extra beam, cast shadow, text or perspective vanishing point. One complete leaf, generous margins, pure solid #FF00FF background.`},
 {id:'door-side-root',prompt:`${style} One independent thin apartment door leaf, opened partway on its vertical hinge; no doorway or doorframe. Elevated ORTHOGRAPHIC RPG camera looking down 50 degrees. In the image the slab is a PARALLELOGRAM: left upper corner (320,250), right upper corner (620,380), left lower corner (320,690), right lower corner (620,820). Its vertical edges are equal and parallel, and its upper and lower edges are parallel; absolutely no convergence. Show its own thin 18px top edge and slim hinge-edge thickness. These coordinates describe projected shape, NEVER print them. Worn graphite teal metal, one fine brass inset line, tiny amber access socket, subtle short-panel seams. Small dark lever on left free edge, hinges at RIGHT edge. No lintel, wall, arch, separate fixed frame, threshold, floor, ground shadow or scene. Isolated full object with generous margins, pure solid #FF00FF background.`},
 {id:'wall-panel-root',prompt:`${style} One straight horizontal module of a thick interior wall for a near-future residential memory district. Axis-aligned elevated ORTHOGRAPHIC view looking down 50 degrees, zero horizontal yaw. Wide rectangular wall face about 800 pixels across and 210 pixels tall, with its physically thick TOP cap visible as an 800 by 65 pixel rectangular horizontal strip above it. All long horizontal edges equal and parallel, no trapezoids, no vanishing point. Flat cropped ends suitable for repeating side by side, no posts. Face of worn blue-gray enamel plates, restrained dark seams, lower graphite service skirting, a narrow cyan maintenance light at one end and tiny warm amber status lamps. Mature inhabited digital city, not hospital, not fantasy. No floor, room, door, opening, furniture, writing, lettering, cast ground shadow or surrounding frame. One complete wall module centered on pure solid #FF00FF background.`},
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
