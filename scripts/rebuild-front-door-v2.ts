import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import {generateImageMedia} from './media-service'
const root='doc/rebuild-20260924/art'
await mkdir(root,{recursive:true})
const health=await fetch('https://game.aiwaves.tech/alteru-media/api/health').then(r=>r.json())
await writeFile(`${root}/health.json`,JSON.stringify(health,null,2))
const style='Restrained chunky 16-bit pixel art, crisp clustered pixels, dark graphite outlines, muted petrol teal and warm amber accents, consistent soft upper-left light. Not photorealistic, no text, no watermark.'
const jobs=[{id:'door-front-root-v2',prompt:`Pixel art sprite for a top-down 2D RPG. Draw a flat rectangular blue-green steel panel with perfectly parallel vertical sides and equal top and bottom width. Its projected silhouette is 480 wide and 540 high, plus a narrow 30 high rectangular top thickness. Camera high above looking downward, orthographic projection, no perspective convergence anywhere. The full-width top surface is visibly viewed from above. Add only a tiny brass horizontal lever on the left and two small hinges on the right. The lever circular mounting plate is seen from above as a WIDE FLAT ELLIPSE, not a circle. This is an isolated door leaf with no frame, no top beam and no surrounding architectural parts. Sparse panel seams and one tiny amber access light, restrained worn petrol teal finish, chunky pixel clusters, dark outline, warm upper-left light. No perspective trapezoid, no narrowing at the bottom, no ground, no cast shadow, no writing. Solid magenta #FF00FF background. Whole object centered with empty margin.`}]

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
