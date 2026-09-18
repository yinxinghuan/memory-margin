import type {StoryCartridge,StorySave,Locale,DomainActionRule,DomainRequirement,DomainEffect} from './vendor/story/types'
import {createInitialSave} from './vendor/story/engine/reducer'
import {resolveDomainAction,applyDomainResolution} from './vendor/story/engine/domainRules'

export type {StorySave,Locale}
export const t=(locale:Locale,zh:string,en:string)=>locale==='zh'?zh:en
const requirement=(id:string,equals:boolean,locale:Locale,zh:string,en:string):DomainRequirement=>({type:'fact',id,equals,reason:t(locale,zh,en)})
const set=(id:string):DomainEffect=>({type:'fact',id,value:true})
const rule=(id:string,requirements:DomainRequirement[],effects:DomainEffect[],text:string):DomainActionRule=>({id,intent:id,match:[id],matchMode:'exact',requirements,effects,successText:text,successChoices:[],dangerPolicy:'suppress'})

export function cartridge(locale:Locale):StoryCartridge{
 const tx=(zh:string,en:string)=>t(locale,zh,en)
 const yes=(id:string,zh:string,en:string)=>requirement(id,true,locale,zh,en)
 const no=(id:string,zh:string,en:string)=>requirement(id,false,locale,zh,en)
 return {schemaVersion:1,id:'memory-margin',locale,coverImage:'./art/home.png',
  copy:{title:tx('记忆余量','Memory Margin'),subtitle:tx('转生后的第一天','First day after transfer'),promise:tx('找回一段属于自己的声音。','Find the missing end of your own memory.'),enter:tx('醒来','Wake'),continue:tx('继续','Continue'),customAction:tx('询问','Ask'),itemImagingTitle:'',itemImagingBody:''},
  theme:{outer:'#0b1822',surface:'#263b43',paper:'#e8ebe3',ink:'#e8ebe3',muted:'#a9bdc1',accent:'#69c4c5',danger:'#ed8f85',gold:'#e2ad68',material:'apartment'},
  audioTheme:{material:'apartment',bpm:70,rootHz:110,scale:[0,3,7],levels:{music:0,ambient:0,sfx:0,master:0},tension:[]},
  statDefinitions:[],drawerLabels:{party:tx('已见的人','People met'),map:tx('地点','Places'),inventory:tx('随身物','Items'),log:tx('档案','Records')},
  opening:{location:tx('转生居所','Arrival Room'),time:'06:42',objective:tx('听听桌上的语音盒。','Play the voice box on the table.'),imagePrompt:'',blocks:[{id:'arrival',kind:'narration',text:tx('你在一间像家、却还没有你的气味的房间醒来。门外有人推着早餐车经过。桌上的语音盒亮了一下，显示“你留下的第一段”。','You wake in a room that looks like home but does not smell like yours yet. A breakfast cart passes outside. The voice box on the table lights up: “Your first saved moment.”')}],choices:[]},
  initialFacts:{voiceHeard:false,receiptRead:false,neighborMet:false,caretakerMet:false,sealRead:false,clerkMet:false,ledgerRead:false,compared:false,kept:false,lent:false,decisionSeen:false,voiceRevisited:false},
  characters:[],initialPartyMemberIds:[],initialInventory:[],initialMap:[{id:'home',label:tx('转生居所','Arrival Room'),current:true,visited:true},{id:'hall',label:tx('公共走廊','Shared Hall'),connectedTo:'home',current:false,visited:false},{id:'service',label:tx('记忆服务点','Memory Service'),connectedTo:'hall',current:false,visited:false}],demoTurns:[],domainRules:{rules:[
   rule('listen-voice',[no('voiceHeard','你已听过这段声音。','You have heard this voice.')],[set('voiceHeard')],tx('语音里，你自己说：“等我转生，我们去吃那家……”声音在店名之前断了。进度条留下整齐的一小段空白。桌上还有一张迁入回执。','You hear your own voice: “After the transfer, let’s eat at that…” It stops before the place name. A neat blank remains in the progress bar. There is an arrival receipt on the desk.')),
   rule('read-receipt',[yes('voiceHeard','先听听语音盒。','Play the voice box first.'),no('receiptRead','回执已经存入档案。','The receipt is already in your records.')],[set('receiptRead'),{type:'inventory',action:'add',itemId:'arrival-receipt',count:1,item:{id:'arrival-receipt',label:tx('迁入回执','Arrival receipt'),count:1,detail:tx('转生完成。私人记忆 01：暂存。授权栏空白。','Transfer complete. Personal memory 01: temporary hold. Authorization field blank.')}}],tx('回执上写着“转生完成”。私人记忆 01 被标为“暂存”，授权栏却是空白。下面的小字叫你去公共走廊尽头核对。','The receipt says “Transfer complete.” Personal memory 01 is marked “temporary hold,” but its authorization field is blank. Fine print sends you to the end of the shared hall.')),
   rule('to-hall',[],[{type:'map',nodeId:'hall'}],tx('走廊里有人等电梯。墙边的值守人把一张封签按得更牢，看见你时没有打招呼。','Someone waits by the lift. An attendant presses a seal more firmly onto the wall and does not greet you.')),
   rule('to-home',[],[{type:'map',nodeId:'home'}],tx('你回到那间尚未完全属于自己的房间。语音盒还在桌上。','You return to the room that does not quite feel yours. The voice box remains on the table.')),
   rule('talk-neighbor',[no('neighborMet','她刚才的话已经记下。','You have noted what she said.')],[set('neighborMet')],tx('等电梯的女孩抱着一袋热面包。她把胸牌转向你：“安禾。你刚来吧？昨晚那位值守人把这里的自动借用口封了。有人骂他多管闲事。要查的话，封签上有时间。”她把面包往你手里塞了一只，没有索取什么。','The woman by the lift holds warm bread. She turns her name badge toward you: “Anhe. You just arrived? That attendant sealed the automatic lending port last night. People complained. There is a time on the seal.” She gives you a roll and asks for nothing.')),
   rule('talk-caretaker',[no('caretakerMet','他不愿再重复。','He does not repeat himself.')],[set('caretakerMet')],tx('值守人皱着眉，把你伸向窗口方向的手挡开。袖章上写着“骆”。“叫我骆叔。新来的，先看字，再签。你们总以为好听的话不收费。”他没有解释，转身继续守着封口。','The attendant frowns and blocks your reaching hand. His sleeve reads “Luo.” “Call me Luo. New arrival, read before you sign. You people always think kind words cost nothing.” He returns to the sealed port.')),
   rule('read-seal',[no('sealRead','封签已经记下。','The seal is already recorded.')],[set('sealRead')],tx('封签写着：昨夜 23:16，自动借用口暂停。发起人是这名值守人。暂停理由只有一行：“授权栏空白，不能代签。”','The seal reads: 23:16 last night, automatic lending port suspended. The attendant signed it. One line gives the reason: “Blank authorization cannot be signed for someone else.”')),
   rule('to-service',[],[{type:'map',nodeId:'service'}],tx('服务点开着暖灯。窗口职员抬头看你，像早就知道你会来。','Warm light fills the service counter. The clerk looks up as if expecting you.')),
   rule('service-to-hall',[],[{type:'map',nodeId:'hall'}],tx('你带着窗口里的话回到走廊。那张封签仍在墙上。','You return to the hall with the clerk’s words. The seal is still on the wall.')),
   rule('talk-clerk',[no('clerkMet','她已经说过了。','She has said her piece.')],[set('clerkMet')],tx('窗口职员的名牌写着“乔弥”。她轻声说：“刚转生，记忆偶尔缺一截很正常。我们可以替你保住最珍贵的部分。签一下就好，剩下的我会处理。”她把表格推来，手指恰好盖住了“使用人”一栏。','The clerk’s badge reads “Qiaomi.” She speaks softly. “A gap is normal after transfer. We can protect what matters most. Just sign and I’ll handle the rest.” She slides a form forward, one finger resting over the “user” field.')),
   rule('read-ledger',[yes('receiptRead','先拿自己的回执核对。','Bring your own receipt first.'),no('ledgerRead','这条记录已经存入档案。','This entry is already in your records.')],[set('ledgerRead')],tx('公开记录：你的私人记忆 01 在 23:17 被列为“待借用”。使用人是一位未公开的永生账户；你尚未授权。记录最下方有一行红字：“签名后 30 天内不可撤回。”','Public register: your personal memory 01 was queued for lending at 23:17. The user is an undisclosed long-lived account; you have not authorized it. Red text at the bottom: “Cannot revoke for 30 days after signing.”')),
   rule('compare-records',[yes('receiptRead','需要自己的迁入回执。','You need your arrival receipt.'),yes('sealRead','先看看走廊的封签。','Check the seal in the hall.'),yes('ledgerRead','先查看公开使用记录。','Read the public use register.'),yes('clerkMet','先问问窗口职员。','Ask the clerk first.'),no('compared','你已核对过三处记录。','You have compared the three records.')],[set('compared')],tx('回执空白、23:16 的封口、23:17 的待借用记录对上了。语音结尾被单独放进待借用区。值守人阻止了自动代签，窗口的“保住”实际要你让出使用权。现在可以撤下借用、取回结尾，但它会占满当前唯一的长期保留位置；也可以借出 30 天，腾出这一格，期间无法收回结尾。','The blank receipt, the 23:16 seal and the 23:17 lending entry align. The ending was placed in a lending queue. The attendant stopped an automatic signature. You may withdraw it and recover the ending, filling your only long-term slot; or lend it for 30 days and free that slot, unable to recall the ending during that period.')),
   rule('choose-keep',[yes('compared','先核对记录，再决定。','Compare the records before deciding.'),no('kept','你已经选择保留。','You already chose to keep it.'),no('lent','你已经作出借用选择。','You already chose to lend it.')],[set('kept')],tx('你要求撤下待借用记录。职员的笑停了一瞬。她交还语音的结尾，但提醒你：这段记忆会占据你当前能长期保留的一整格。你知道今晚会听到完整句子，也知道下一段记忆该怎么办仍没有答案。','You remove the lending entry. The clerk’s smile pauses. She returns the missing end, warning that this memory will fill your current long-term slot. You will hear the full sentence tonight. The next memory is still a question.')),
   rule('choose-lend',[yes('compared','先核对记录，再决定。','Compare the records before deciding.'),no('kept','你已经选择保留。','You already chose to keep it.'),no('lent','你已经作出借用选择。','You already chose to lend it.')],[set('lent')],tx('你同意借用 30 天，腾出一个长期保留位置。职员立即露出放心的神情。语音结尾仍不能播放；现在你至少知道是谁让它缺失，也知道有人会在别处反复使用它。','You agree to lend it for 30 days and free a long-term slot. The clerk looks relieved. The ending still will not play. At least now you know why it is missing, and that someone else will repeatedly use it.')),
   rule('inspect-decision',[no('decisionSeen','这份处理结果已记录。','The decision is already recorded.')],[set('decisionSeen')],tx('处理台显示你的选择已经生效。你可以回居所确认语音，也可以到走廊再看看那些人。','The desk shows your decision is active. You can return home to check the voice, or revisit the people in the hall.')),
   rule('revisit-voice',[no('voiceRevisited','你已确认这段语音的状态。','You already checked the voice.')],[set('voiceRevisited')],tx('你再次按下播放。','You press play again.')),
  ]}}
}

export function initialStory(locale:Locale){const save=createInitialSave(cartridge(locale));save.entered=true;save.blocks=save.blocks.filter(b=>b.kind!=='image'&&b.kind!=='choices');return save}
export function objective(s:StorySave){const f=s.facts,tx=(zh:string,en:string)=>t(s.locale,zh,en)
 if(f.voiceRevisited)return tx('第一段记忆的去向已明。你可以继续探索。','You know where the first memory went. You can keep exploring.')
 if(f.kept||f.lent)return tx('回居所，再听一次语音。','Return home and play the voice again.')
 if(f.compared)return tx('在处理台选择这段记忆的使用方式。','Choose who may use this memory at the desk.')
 if(!f.voiceHeard)return tx('听听桌上的语音盒。','Play the voice box on the table.')
 if(!f.receiptRead)return tx('查看桌上的迁入回执。','Read the arrival receipt.')
 if(!f.sealRead)return tx('去公共走廊，看看墙上的封签。','Find the seal in the shared hall.')
 if(!f.clerkMet||!f.ledgerRead)return tx('到服务点问人，并核对公开记录。','Ask at memory service and check its register.')
 return tx('在处理台并列核对回执、封签与记录。','Compare the receipt, seal and register at the desk.')
}
export function applyAction(base:StorySave,action:string){
 if(action==='inspect-decision'&&!base.facts.kept&&!base.facts.lent)return {save:base,accepted:false,text:t(base.locale,'还没有处理结果。','There is no decision yet.')}
 if(action==='revisit-voice'&&!base.facts.kept&&!base.facts.lent)return {save:base,accepted:false,text:t(base.locale,'先到服务点弄清缺失的结尾。','Find out about the missing ending at memory service first.')}
 const c=cartridge(base.locale),resolution=resolveDomainAction(base,c,action);if(!resolution)throw new Error('UNKNOWN_ACTION')
 if(resolution.status==='rejected')return {save:base,accepted:false,text:resolution.reasons.join(' ')}
 const text=action==='revisit-voice'?(base.facts.kept?t(base.locale,'语音终于接上：“……旧桥口那家只开到天亮的面馆。你不用再替我记菜单。”你听见自己笑了一声。这段琐碎的约定，终于完整地留在你这里。','The voice finally continues: “…the noodle shop by the old bridge, the one open until dawn. You won’t have to remember the menu for me.” You hear yourself laugh. This small promise is yours again.'):t(base.locale,'语音停在同一个缺口。屏幕下方多了一行：外部借用中，剩余 30 天。你留住了下一个记忆的位置，却暂时听不到这句话的结尾。','The voice stops at the same gap. A new line reads: lent externally, 30 days remaining. You kept a slot for the next memory, but cannot hear the end of this sentence yet.')):resolution.successText
 const save=structuredClone(base);save.scene++;save.blocks.push(...applyDomainResolution(save,c,{...resolution,successText:text}));save.objective=objective(save)
 return {save,accepted:true,text}
}
