import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import {generateImageMedia} from './media-service'
const root='doc/rebuild-20260924/art'
await mkdir(root,{recursive:true})
const health=await fetch('https://game.aiwaves.tech/alteru-media/api/health').then(r=>r.json())
await writeFile(`${root}/health.json`,JSON.stringify(health,null,2))
const style='Restrained chunky 16-bit pixel art, crisp clustered pixels, dark graphite outlines, muted petrol teal and warm amber accents, consistent soft upper-left light. Not photorealistic, no text, no watermark.'
const jobs=[
 {id:'neighbor-root',prompt:`${style} One complete full-body woman aged 38, medium brown skin, short dark curly hair, practical plum cropped jacket over pale gray shirt, straight dark slate trousers, flat ankle boots. Calm but alert ordinary resident, not a nurse, no uniform or costume. Mature adult proportions about 5.5 heads tall, clear substantial silhouette and bold readable pixel clusters. Elevated ORTHOGRAPHIC RPG camera looking down 50 degrees, zero sideways yaw. Facing south toward viewer, see crown of head and shoulder tops, both feet parallel, arms relaxed. Pure solid #FF00FF background, entire body centered with margins, no ground, cast shadow, letters or sprite sheet.`},
 {id:'caretaker-root',prompt:`${style} One complete full-body maintenance attendant aged 58, weathered light olive skin, close-cropped salt-and-pepper hair and short gray beard, charcoal utility jacket with a small muted teal shoulder panel, dark brown straight trousers, worn work boots. Broad slightly stocky silhouette, visibly older mature face, ordinary worker not soldier, no hat or handheld objects. Mature adult proportions about 5.5 heads tall, bold readable pixel clusters. Elevated ORTHOGRAPHIC RPG camera looking down 50 degrees, zero sideways yaw. Facing south toward viewer, see crown of head and shoulder tops, both feet parallel, arms relaxed. Pure solid #FF00FF background, entire body centered with margins, no ground, cast shadow, letters or sprite sheet.`},
 {id:'clerk-root',prompt:`${style} One complete full-body memory service clerk aged 45, deep brown skin, close short natural hair, muted blue-teal tailored work jacket and straight charcoal trousers, sensible dark shoes, tiny amber rectangular badge without letters. Upright precise posture, reserved experienced adult face, not a nurse or fantasy costume. Mature adult proportions about 5.5 heads tall, bold readable pixel clusters. Elevated ORTHOGRAPHIC RPG camera looking down 50 degrees, zero sideways yaw. Facing south toward viewer, see crown of head and shoulder tops, both feet parallel, arms relaxed. Pure solid #FF00FF background, entire body centered with margins, no ground, cast shadow, letters or sprite sheet.`},
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
