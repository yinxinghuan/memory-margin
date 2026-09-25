import {discoveries} from './exploration'
import {cartridge,type StorySave,type Locale} from './story'
import {resolveDomainAction} from './vendor/story/engine/domainRules'
export const recordIdForEntity:Record<string,string>={...Object.fromEntries(discoveries.map(d=>[d.entity,d.entity])),receipt:'receipt',seal:'seal',ledger:'ledger','breakfast-card':'breakfast','hall-notice':'hall-notice','terms-card':'terms','preview-screen':'preview'}
export function actionBlockReason(save:StorySave,action:string){
 const result=resolveDomainAction(save,cartridge(save.locale),action)
 return result?.status==='accepted'?'':result?.reasons.join(save.locale==='zh'?'；':'; ')??(save.locale==='zh'?'此操作暂不可用。':'This action is unavailable.')
}
export function panelDescription(id:string,f:StorySave['facts'],locale:Locale){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const discovery=discoveries.find(d=>d.entity===id);if(discovery)return discovery.intro[locale==='zh'?0:1]
 switch(id){
 case 'voice-box':return f.morningStored?t('今早的印象已长期保留在语音盒里。','This morning’s impression is kept in the voice box.'):f.morningHandled?t('今早的印象仍在临时缓存中，将在今天结束时清空。','This morning’s impression remains temporary and will be cleared at the end of today.'):f.kept?t('昨夜的声音已经完整取回。','Last night’s voice has been recovered in full.'):f.lent?t('昨夜的声音已借出，30 天内无法取回结尾。','Last night’s voice is on loan; its ending cannot be recalled for 30 days.'):f.voiceHeard?t('那段属于你的声音，在结尾处断掉了。','Your own voice breaks off before the ending.'):t('语音盒亮着“你留下的第一段”。','The voice box reads “Your first saved fragment.”')
 case 'receipt':return t('桌上放着你的迁入回执。','Your arrival receipt lies on the desk.')
 case 'breakfast-card':return t('杯子下压着一张早餐便条。','A breakfast note sits beneath the cup.')
 case 'seal':return t('墙上的封签标着一个暂停时间。','A suspension time is marked on the seal.')
 case 'hall-notice':return t('走廊墙上贴着住户留下的告示。','A resident’s notice hangs on the hall wall.')
 case 'ledger':return t('档案架上放着可供核对的公开记录。','The rack holds public records for comparison.')
 case 'terms-card':return t('窗口旁的说明牌列着记忆保留和借用的条款。','The sign beside the counter describes memory retention and lending.')
 case 'choice-desk':return f.kept?t('你已选择取回结尾，唯一的长期记忆位已被占用。','You chose to recover the ending, filling your only long-term slot.'):f.lent?t('你已选择借出 30 天，长期记忆位已经空出。','You chose a 30-day loan, freeing your long-term slot.'):f.compared?t('记录已核对。请在签名前查看两种选择的条款。','The records are compared. Review the terms of both choices before signing.'):t('处理台上的三处记录，需要与你的回执一起核对。','Compare the three records at this desk with your receipt.')
 case 'preview-screen':return f.previewTraced?t('预览已关闭，收听账户 C-09 已记下。','Preview is stopped; listener account C-09 is recorded.'):f.previewStopped?t('预览已关闭，23:17 的收听记录仍保留着。','Preview is stopped; the 23:17 listening record remains.'):t('窗口预览屏仍亮着。','The counter’s preview screen is still lit.')
 default:return t('对方留意到你，等待你开口。','They notice you and wait for you to speak.')
 }
}
