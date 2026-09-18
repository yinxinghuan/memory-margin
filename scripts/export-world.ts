import {mkdirSync,writeFileSync} from 'node:fs'
import {Resvg} from '@resvg/resvg-js'
import {world,entities,portals,type Scene} from '../src/world'

mkdirSync('public/map',{recursive:true});mkdirSync('public/art',{recursive:true});mkdirSync('doc',{recursive:true})
const png=(svg:string)=>new Resvg(svg,{fitTo:{mode:'original'}}).render().asPng()
const r=(x:number,y:number,w:number,h:number,fill:string,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`
const tile=(warm:boolean)=>{let out='';for(let y=64;y<454;y+=24)for(let x=54;x<330;x+=24){const shade=((x*13+y*7)%5===0)?(warm?'#334b4b':'#213640'):(warm?'#2d4144':'#1b303a');out+=r(x,y,23,23,shade)}return out}
const shell=(scene:Scene)=>{
 const warm=scene==='home',base=warm?'#142733':'#10232f'
 let detail=''
 if(scene==='home')detail=r(62,86,95,48,'#42565a')+r(69,94,81,30,'#6f8683')+r(64,321,81,78,'#506266')+r(71,330,66,55,'#a59982')+r(200,327,83,70,'#364e51')+r(208,335,68,54,'#4c6769')+r(151,115,72,40,'#223b43')
 if(scene==='hall')detail=r(164,65,52,83,'#354c55')+r(172,73,36,63,'#1d3039')+r(75,304,232,12,'#627273')+r(75,318,232,4,'#1a3038')+r(110,96,162,13,'#627273')
 if(scene==='service')detail=r(74,91,236,66,'#314950')+r(82,100,220,42,'#446169')+r(76,351,230,8,'#637373')+r(102,163,180,16,'#a8aa96')+r(110,181,164,8,'#314c52')
 const lines=r(54,64,276,2,'#748b87')+r(54,452,276,2,'#0b1822')+r(54,64,2,390,'#748b87')+r(328,64,2,390,'#091821')
 const light=scene==='home'?r(225,70,74,5,'#d8c3a0'):scene==='hall'?r(171,70,42,4,'#b9c7b8'):r(94,70,196,5,'#d8c3a0')
 return `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="512" shape-rendering="crispEdges">${r(0,0,384,512,base)}${tile(warm)}${lines}${detail}${light}${r(54,455,276,10,'#0b1822')}</svg>`
}
for(const scene of Object.keys(world.scenes) as Scene[])writeFileSync(`public/art/${scene}.png`,png(shell(scene)))

let frames=''
for(let row=0;row<4;row++)for(let col=0;col<3;col++){
 const x=col*32,y=row*32,step=col-1
 const face=row===0,back=row===3
 frames+=r(x+13,y+4,7,6,back?'#283943':'#bd9d82')
 frames+=r(x+11,y+3,11,3,'#283943')
 frames+=r(x+10,y+11,13,12,'#beac8b')
 frames+=r(x+12,y+13,9,8,'#314b55')
 frames+=r(x+8,y+13,3,10,'#a78b75')+r(x+22,y+13,3,10,'#a78b75')
 frames+=r(x+12+step,y+23,4,6,'#26353f')+r(x+18-step,y+23,4,6,'#26353f')
 frames+=r(x+11+step,y+29,6,2,'#14252e')+r(x+17-step,y+29,6,2,'#14252e')
 if(face)frames+=r(x+14,y+8,2,1,'#1a252a')+r(x+19,y+8,2,1,'#1a252a')
}
writeFileSync('public/art/hero.png',png(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="128" shape-rendering="crispEdges">${frames}</svg>`))
writeFileSync('public/map/transparent.png',png('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"/>'))
writeFileSync('public/map/floor.tsx','<?xml version="1.0"?><tileset name="floor" tilewidth="32" tileheight="32" tilecount="1" columns="1"><image source="transparent.png" width="32" height="32"/></tileset>')
const scenes=Object.entries(world.scenes).map(([id,s])=>{
 const b=s.interior,obstacles=[{x:0,y:0,w:384,h:b.y},{x:0,y:b.y+b.h,w:384,h:512-b.y-b.h},{x:0,y:0,w:b.x,h:512},{x:b.x+b.w,y:0,w:384-b.x-b.w,h:512},...s.obstacles]
 const objects=obstacles.map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('')
 writeFileSync(`public/map/${id}.tmx`,`<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="16" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="floor.tsx"/><layer id="1" name="floor" width="12" height="16"><data encoding="csv">${Array(192).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`)
 return {id,background:id,walkRegion:s.interior,spawn:s.spawn,obstacles:s.obstacles,targets:Object.values(entities).filter(e=>e.scene===id).map(e=>({id:e.id,approach:e.approach,states:['static'],renderedStates:['static']}))}
})
const assets=[...(['home','hall','service'] as Scene[]).map(id=>({id,path:`public/art/${id}.png`,imageWidth:384,imageHeight:512,crops:[{x:0,y:0,w:384,h:512}]})),{id:'hero',path:'public/art/hero.png',imageWidth:96,imageHeight:128,crops:Array.from({length:12},(_,i)=>({x:i%3*32,y:Math.floor(i/3)*32,w:32,h:32}))}]
const manifest={version:1,world:{width:384,height:512,step:world.step},actor:{width:world.actor.w,height:world.actor.h},assets,scenes,portals:Object.entries(portals).map(([id,p])=>({id,from:p.from,to:p.scene,arrival:p.position}))}
writeFileSync('doc/world-manifest.json',JSON.stringify(manifest,null,2)+'\n')
console.log('Exported three independently authored maps and the runtime world manifest')
