import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import {generateImageMedia} from './media-service'
const root='doc/rebuild-20260924/art'
const parent=JSON.parse(await readFile(`${root}/hero-root.json`,'utf8'))
if(parent.status!=='downloaded')throw new Error('ROOT_NOT_READY')
const jobs=[
 ['down-b-v2','Facing SOUTH toward viewer. The shoe on SCREEN LEFT must be LOWEST in the image, firmly planted closest to viewer. Shoe on SCREEN RIGHT must be much HIGHER, lifted trailing behind. The hand on SCREEN RIGHT swings toward viewer (lower), hand on SCREEN LEFT swings away (higher). This is an asymmetric walking contact pose, absolutely NOT two planted feet. Keep the face looking slightly down, not straight at camera.'],
 ['left-b-v2','Facing WEST (nose points SCREEN LEFT), exact side profile. The camera-near shoulder arm is clearly visible on the outside of the torso: that near arm MUST swing BACK toward SCREEN RIGHT with its hand behind the hip. The camera-near thigh extends BACK toward SCREEN RIGHT and ends in a lifted heel. The FAR leg crosses in front toward SCREEN LEFT, planted, visibly partially behind the near thigh at the hip. The far hand reaches LEFT ahead of abdomen. This near arm and near leg arrangement is mandatory: near hand on RIGHT of torso, not LEFT. Compact natural walking stride.'],
 ['up-b-v2','Facing NORTH away from viewer. ONLY rear of head and jacket, NO face. The boot on SCREEN LEFT is LOWEST in the image, trailing toward bottom with its sole heel lifted and visible. Boot on SCREEN RIGHT is HIGHER toward top, stepping forward away from viewer. Left-screen arm swings toward top, right-screen arm trails toward bottom with hand lower. Do NOT put the right-screen boot at the bottom.'],
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
