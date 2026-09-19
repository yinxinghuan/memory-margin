import {mkdirSync,writeFileSync} from 'node:fs'
import {dirname,resolve} from 'node:path'
import {auditExits,auditPlacements,auditRoomWorld} from '../src/generated-room-world'

const phase={
 spawn:auditRoomWorld.scenes['generated-audit-room'].spawn,
 exits:auditExits,
 slots:auditPlacements.map(item=>({id:item.id,footprint:item.obstacle})),
}
const contract={
 version:1,
 sceneId:'generated-audit-room',
 shell:{
  enterable:true,
  ...phase,
  playerCopy:{
   status:{zh:'世界正在加载',en:'The world is forming'},
   hint:{zh:'你可以先四处看看',en:'You can look around now'},
  },
 },
 complete:phase,
}
const output=resolve('assets/benchmark/generated-room/progressive-room-contract.json')
mkdirSync(dirname(output),{recursive:true})
writeFileSync(output,JSON.stringify(contract,null,2)+'\n')
console.log(output)
