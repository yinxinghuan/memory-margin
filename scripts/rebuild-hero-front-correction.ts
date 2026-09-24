import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import {generateImageMedia} from './media-service'
const root='doc/rebuild-20260924/art'
const parent=JSON.parse(await readFile(`${root}/hero-root.json`,'utf8'))
if(parent.status!=='downloaded')throw new Error('ROOT_NOT_READY')
const jobs=[
 ['down-b-v3','FRONT WALK CONTACT, facing south toward viewer. LOCK THE IMAGE GEOMETRY: head centered around x=512 y=160; body centered x=512. The shoe on the LEFT HALF OF THE IMAGE must touch y=910 around x=420. This is the forward PLANTED leg, drawn long below the jacket. The shoe on the RIGHT HALF must stop around x=595 y=770: this leg bends backward at the knee and is SHORTER IN THE IMAGE. Thus the LEFT shoe must be at least 100 pixels LOWER than the RIGHT shoe. The RIGHT-screen hand is around x=670 y=520 and swings forward toward viewer, LEFT-screen hand near x=350 y=420 swings backward. These are layout coordinates ONLY, do not draw any text, numbers or guides. Do NOT put the right shoe lower. Keep complete character in frame.'],
]

for(const [id,pose] of jobs){
 const path=`${root}/hero-${id}.json`;let record:any
 try{record=JSON.parse(await readFile(path,'utf8'))}catch{record={id:`hero-${id}`,requestId:randomUUID(),mode:'edit',referenceUrls:[parent.result.media.url],parent:'hero-root',model:'gpt-image-2.5-sunburst',quality:'high',background:'opaque',prompt:`The reference establishes this SAME adult character, hair, face, jacket, trousers, shoes, proportions and pixel density. Draw ONE complete full-body pose, not a sheet. ${pose} Preserve elevated orthographic RPG camera looking down 50 degrees, see crown of head and shoulder tops. Keep mature roughly five-head proportions and both feet visible. Do not reuse the standing leg pose for walking. Restrained crisp 16-bit pixel clusters, dark outlines. Entire body centered with margins on pure solid #FF00FF. No shadow, no ground, no text.`,status:'prepared'};await writeFile(path,JSON.stringify(record,null,2))}
 if(record.status==='downloaded')continue
 try{const started=Date.now();const result=record.result??await generateImageMedia({sessionId:'b198e25d-5781-48c3-930a-143ed23a92b4',requestId:record.requestId,mode:'edit',prompt:record.prompt,referenceUrls:record.referenceUrls,model:record.model,quality:'high',background:'opaque',size:{width:1024,height:1024}})
 record.result=result;record.elapsedMs=Date.now()-started;record.status='generated';await writeFile(path,JSON.stringify(record,null,2))
 const response=await fetch(result.media.url);if(!response.ok)throw new Error(`download ${response.status}`)
 const bytes=Buffer.from(await response.arrayBuffer());await writeFile(`${root}/hero-${id}.webp`,bytes);record.sha256=createHash('sha256').update(bytes).digest('hex');record.status='downloaded';record.visualQA='pending';await writeFile(path,JSON.stringify(record,null,2));console.log(id,record.elapsedMs)
 }catch(e){record.error=String(e);await writeFile(path,JSON.stringify(record,null,2));console.error(id,String(e));process.exitCode=1;break}
}
