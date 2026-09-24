import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import {generateImageMedia} from './media-service'
const root='doc/rebuild-20260924/art'
const parent=JSON.parse(await readFile(`${root}/hero-root.json`,'utf8'))
if(parent.status!=='downloaded')throw new Error('ROOT_NOT_READY')
const jobs=[
 ['down-a','Facing south toward viewer. Walk contact A: anatomical left foot forward toward bottom of image with sole planted, right foot trailing with heel lifted. Right arm forward, left arm back.'],
 ['down-b','Facing south toward viewer. Walk contact B: anatomical RIGHT foot forward toward bottom of image with sole planted, LEFT foot trailing with heel lifted. LEFT arm forward, RIGHT arm back. Opposite support leg from contact A.'],
 ['left-stand','Facing WEST, exact left-facing profile. Relaxed standing, both shoes close together flat on floor, arms down. No stride.'],
 ['left-a','Facing WEST, exact left-facing profile. Walking contact A: camera-near leg extended forward toward LEFT, far leg extended backward toward RIGHT, near arm back and far arm forward. Compact normal walking stride, not running.'],
 ['left-b','Facing WEST, exact left-facing profile. Walking contact B: camera-near leg extends backward toward RIGHT, FAR leg forward toward LEFT. Near arm forward and far arm back. Clearly swap near and far support legs, compact natural walking stride.'],
 ['up-stand','Facing NORTH away from viewer. Only back of head, back of jacket and backs of legs visible. Relaxed standing, both shoes close together flat on floor, arms down. No visible eyes or face.'],
 ['up-a','Facing NORTH away from viewer. Only back of head and back of jacket, NO face. Walk contact A: anatomical left leg advances toward top of image, right leg trails toward bottom with heel lifted, right arm forward and left arm back.'],
 ['up-b','Facing NORTH away from viewer. Only back of head and back of jacket, NO face. Walk contact B: anatomical RIGHT leg advances toward top of image, LEFT leg trails toward bottom with heel lifted, LEFT arm forward and RIGHT arm back. Opposite support leg from contact A.'],
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
