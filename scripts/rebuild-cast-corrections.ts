import {readFile,writeFile} from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import {generateImageMedia} from './media-service'
const root='doc/rebuild-20260924/art'
const common='Keep exactly the reference identity, outfit, age, silhouette and restrained pixel density. One complete full-body sprite, elevated orthographic RPG view down 50 degrees, see crown and shoulder tops, no sideways camera yaw. About 5.5 heads tall, complete body centered with margins. Pure solid #FF00FF background, no ground, no shadow, no text.'
const poses:Record<string,string>={
 'left-stand':'Standing still facing screen LEFT in exact side profile, both feet together, arms relaxed.',
 'up-stand':'Standing still facing NORTH away from viewer. Back of head and jacket only, absolutely no face. Both feet together.',
 'left-a':'Facing screen LEFT. Near leg forward toward LEFT, far leg back toward RIGHT. Camera-near arm must swing BACK toward RIGHT, hand behind hip. Far arm forward toward LEFT. Compact walking contact A.',
 'left-b':'Facing screen LEFT. Camera-near leg extends BACK toward RIGHT with lifted heel, FAR leg forward toward LEFT, planted. Camera-near arm forward toward LEFT, FAR arm swings BACK toward RIGHT. Swap the visible support leg from A, compact walking contact B.',
 'up-a':'Facing away from viewer NORTH. Back of head and jacket only. Shoe on SCREEN RIGHT extends to bottom of image, trailing lifted heel; SCREEN LEFT shoe is higher toward top, advancing. SCREEN LEFT hand lower, right hand higher. Walking contact A.',
 'up-b':'Facing away from viewer NORTH. Back of head and jacket only. Shoe on SCREEN LEFT extends to bottom of image, trailing lifted heel; SCREEN RIGHT shoe is higher toward top, advancing. SCREEN RIGHT hand lower, left hand higher. Walking contact B.',
 'down-a':'Facing viewer SOUTH. Shoe on SCREEN RIGHT must be lowest in image, forward planted. SCREEN LEFT shoe is at least 100 pixels higher, trailing with bent knee. Left-screen hand swings forward lower, right-screen hand back higher. Walking contact A.',
 'down-b':'Facing viewer SOUTH. Shoe on SCREEN LEFT must be lowest in image around x420,y910, forward planted. SCREEN RIGHT shoe around x590,y770 at least 100 pixels higher, trailing with bent knee. Right-screen hand swings forward lower, left-screen hand back higher. Walking contact B. Do not draw coordinate text.',
 portrait:'Create a close-up chest-up dialogue portrait of this SAME character. Preserve visible age, face, hair and clothing. Calm natural expression, slightly turned toward viewer. Restrained detailed pixel-art portrait, dark petrol neutral backdrop, no text, no frame. This is a portrait, not a map sprite.',
}
poses['left-a-v2']='Keep the EXACT WEST-facing side-profile camera from the reference: nose points left, only one eye visible; do not turn face or chest toward viewer. Walking contact A: camera-near leg FORWARD toward LEFT, far leg BACK toward RIGHT. Near arm BACK toward RIGHT with visible hand behind hip, far arm FORWARD to LEFT. Keep torso upright, compact natural stride.'
poses['left-b-v2']='Keep the EXACT WEST-facing side-profile camera from reference: nose points left, only one eye visible; do not turn face or chest toward viewer. Walking contact B: camera-near leg BACK toward RIGHT, far leg FORWARD toward LEFT planted. Near arm FORWARD toward LEFT with hand ahead of belly, far arm BACK toward RIGHT. Swap support leg and arm from contact A.'
poses['up-b-v2']='Maintain exact BACK view from reference, NO face visible. Walking: LEFT-HALF shoe must be LOWEST in image at approximately x420,y910, lifted trailing heel. RIGHT-HALF shoe must be HIGHER around x590,y760, stepping away. Right-screen hand trails lower, left-screen hand swings upward. Left shoe must be at least 100 pixels below right shoe. No coordinate labels.'
const jobs=[{id:'neighbor',pose:'left-a-v2',parent:'neighbor-left-stand'},{id:'neighbor',pose:'left-b-v2',parent:'neighbor-left-stand'},{id:'caretaker',pose:'up-b-v2',parent:'caretaker-up-stand'}]

async function run(job:{id:string;pose:string;parent:string}){
 const id=`${job.id}-${job.pose}`,path=`${root}/${id}.json`,parent=JSON.parse(await readFile(`${root}/${job.parent}.json`,'utf8'));let record:any
 try{record=JSON.parse(await readFile(path,'utf8'))}catch{record={id,requestId:randomUUID(),mode:'edit',parent:job.parent,referenceUrls:[parent.result.media.url],model:'gpt-image-2.5-sunburst',quality:'high',background:'opaque',prompt:job.pose==='portrait'?poses.portrait:`${common} ${poses[job.pose]}`,status:'prepared'};await writeFile(path,JSON.stringify(record,null,2))}
 if(record.status==='downloaded')return
 try{const started=Date.now(),result=record.result??await generateImageMedia({sessionId:'b198e25d-5781-48c3-930a-143ed23a92b4',requestId:record.requestId,mode:'edit',prompt:record.prompt,referenceUrls:record.referenceUrls,model:record.model,quality:'high',background:'opaque',size:{width:1024,height:1024}})
 record.result=result;record.elapsedMs=Date.now()-started;record.status='generated';await writeFile(path,JSON.stringify(record,null,2))
 const response=await fetch(result.media.url);if(!response.ok)throw new Error(`download ${response.status}`)
 const bytes=Buffer.from(await response.arrayBuffer());await writeFile(`${root}/${id}.webp`,bytes);record.sha256=createHash('sha256').update(bytes).digest('hex');record.status='downloaded';record.visualQA='pending';await writeFile(path,JSON.stringify(record,null,2));console.log(id,record.elapsedMs)
 }catch(e){record.error=String(e);await writeFile(path,JSON.stringify(record,null,2));throw e}
}
// Two independent requests at a time; never generate a replacement ID automatically.
for(let i=0;i<jobs.length;i+=2){const results=await Promise.allSettled(jobs.slice(i,i+2).map(run));for(const result of results)if(result.status==='rejected')throw result.reason}
