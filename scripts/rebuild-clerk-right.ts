import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import {generateImageMedia} from './media-service'
const root='doc/rebuild-20260924/art'
const parent=JSON.parse(await readFile(`${root}/clerk-root.json`,'utf8'))
if(parent.status!=='downloaded')throw new Error('ROOT_NOT_READY')
const jobs=[['right-stand','Facing EAST toward screen RIGHT. Exactly the same clerk and uniform as reference, preserve the badge on its anatomical side; do not mirror it to the other side. Standing still, both feet together and arms relaxed.']]

for(const [id,pose] of jobs){
 const path=`${root}/clerk-${id}.json`;let record:any
 try{record=JSON.parse(await readFile(path,'utf8'))}catch{record={id:`clerk-${id}`,requestId:randomUUID(),mode:'edit',referenceUrls:[parent.result.media.url],parent:'clerk-root',model:'gpt-image-2.5-sunburst',quality:'high',background:'opaque',prompt:`The reference establishes this SAME adult character, hair, face, jacket, trousers, shoes, proportions and pixel density. Draw ONE complete full-body pose, not a sheet. ${pose} Preserve elevated orthographic RPG camera looking down 50 degrees, see crown of head and shoulder tops. Keep mature roughly five-head proportions and both feet visible. Do not reuse the standing leg pose for walking. Restrained crisp 16-bit pixel clusters, dark outlines. Entire body centered with margins on pure solid #FF00FF. No shadow, no ground, no text.`,status:'prepared'};await writeFile(path,JSON.stringify(record,null,2))}
 if(record.status==='downloaded')continue
 try{const started=Date.now();const result=record.result??await generateImageMedia({sessionId:'b198e25d-5781-48c3-930a-143ed23a92b4',requestId:record.requestId,mode:'edit',prompt:record.prompt,referenceUrls:record.referenceUrls,model:record.model,quality:'high',background:'opaque',size:{width:1024,height:1024}})
 record.result=result;record.elapsedMs=Date.now()-started;record.status='generated';await writeFile(path,JSON.stringify(record,null,2))
 const response=await fetch(result.media.url);if(!response.ok)throw new Error(`download ${response.status}`)
 const bytes=Buffer.from(await response.arrayBuffer());await writeFile(`${root}/clerk-${id}.webp`,bytes);record.sha256=createHash('sha256').update(bytes).digest('hex');record.status='downloaded';record.visualQA='pending';await writeFile(path,JSON.stringify(record,null,2));console.log(id,record.elapsedMs)
 }catch(e){record.error=String(e);await writeFile(path,JSON.stringify(record,null,2));console.error(id,String(e));process.exitCode=1;break}
}
