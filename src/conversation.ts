import {availableTopics} from './conversation-flow'
import type {ConversationHistory} from './conversation-history'
import type {EntityId} from './world'
import type {StorySave} from './story'
import {t} from './story'

export type ConversationTopic={id:string;label:string;reply:string}

export function conversationPages(text:string,locale:StorySave['locale']){
 const limit=locale==='zh'?64:180,tokens=locale==='zh'?Array.from(text):text.match(/\S+\s*|\s+/gu)??[]
 const pages:string[]=[];let page=''
 for(const token of tokens){if(page&&page.length+token.length>limit){pages.push(page);page=''}page+=token}
 if(page)pages.push(page)
 return pages.length?pages:['']
}

const known=(save:StorySave,id:EntityId)=>id==='neighbor'?Boolean(save.facts.neighborMet):id==='caretaker'?Boolean(save.facts.caretakerMet):id==='clerk'?Boolean(save.facts.clerkMet):false

export function conversationName(id:EntityId,save:StorySave){
 return id==='neighbor'?t(save.locale,'玛拉','Mara'):id==='caretaker'?t(save.locale,'伊莱亚斯','Elias'):id==='clerk'?t(save.locale,'伊玛尼','Imani'):''
}

function topicCatalog(id:EntityId,save:StorySave):ConversationTopic[]{
 if(!known(save,id))return []
 const tx=(zh:string,en:string)=>t(save.locale,zh,en),f=save.facts
 const share=f.previewLogRead?{id:'share-findings',label:tx('说说六秒预览记录','Share the six-second preview log'),reply:id==='neighbor'?tx('玛拉把时间戳抄在面包袋背面：“这能证明不是你记错了。昨夜窗口确实先于你的同意响过。”','Mara copies the timestamp onto the bread bag. “This proves you did not misremember it. The counter played before you consented.”'):id==='caretaker'?tx('伊莱亚斯把播放记录和退回的投诉并排：“封签只拦住代签。窗口把同一件事换了名字。”','Elias places the playback log beside his rejected complaint. “The seal stopped the signature. The counter renamed the same act.”'):tx('伊玛尼看完记录，没有再说这是适应期错觉：“时间戳是真的。争议只剩下系统把它叫不叫使用。”','Imani reads the log and stops calling it adjustment. “The timestamp is real. The dispute is whether the system calls it use.”')}:(f.receiptRead||f.sealRead||f.ledgerRead)?{id:'share-findings',label:tx('分享我查到的记录','Share what I found'),reply:id==='neighbor'?tx('玛拉逐行看完：“授权空白，却已经进了待借用。你最好把每一张记录都留着。”','Mara reads each line. “Blank consent, but already queued for lending. Keep every record you find.”'):id==='caretaker'?tx('伊莱亚斯只点了一下 23:16：“把这个时间和窗口下一条记录对上。别只听我们谁说得像真的。”','Elias taps 23:16 once. “Match this time against the next counter record. Do not decide by who sounds convincing.”'):tx('伊玛尼把回执推回来：“单张记录不能说明流程全貌。你可以继续看公开使用记录。”','Imani returns the receipt. “One document does not show the whole process. You may inspect the public use register.”')}:null
 if(id==='neighbor')return [
  {id:'arrival',label:tx('你转生多久了？','How long since your transfer?'),reply:tx('“三个月。前两周我每天醒来都要确认一次，昨天的我有没有被系统清掉。后来不确认了，不代表我放心了。”','“Three months. For two weeks I checked every morning whether yesterday’s me had been cleared. I stopped checking. That does not mean I feel safe.”')},
  {id:'help',label:tx('你为什么帮我？','Why are you helping me?'),reply:tx('“因为我听见过你的声音。也因为下一次被当成公共样本的，可能是我的。”她没有把面包收回去。','“Because I heard your voice. And because mine may be the next one treated as a public sample.” She does not take the bread back.')},
  ...(share?[share]:[]),
  ...(f.neighborPreview?[{id:'preview',label:tx('昨夜还有谁在走廊？','Who else was in the hall?'),reply:tx(f.previewTraced?'“我只看见窗口亮起 C-09。那不是住户编号，更像长期账户。”':'“送餐车、伊莱亚斯，还有窗口后面的人。收听账户被遮住了，我认不出是谁。”',f.previewTraced?'“I only saw C-09 light up. That is not a resident number. It looks like a long-lived account.”':'“The breakfast cart, Elias, and whoever was behind the counter. The listener account was masked.”')}]:[]),
 ]
 if(id==='caretaker')return [
  {id:'seal',label:tx('你为什么封住借用口？','Why did you seal the lending port?'),reply:tx('“授权栏空着。机器说默认同意，我说空白就是没有同意。它们把我的投诉退了回来。”','“The authorization was blank. The machine called that default consent. I called it no consent. They rejected my complaint.”')},
  {id:'authority',label:tx('你能保护这里的人吗？','Can you protect people here?'),reply:tx('“我能挡住我面前的一道口，挡不住制度把另一道口叫成‘方便’。别把制服当成权限。”','“I can block the opening in front of me. I cannot stop the system from calling another opening ‘convenience.’ Do not mistake a uniform for authority.”')},
  ...(share?[share]:[]),
  ...(f.previewLogRead?[{id:'six-seconds',label:tx('六秒也算使用吗？','Do six seconds count as use?'),reply:tx('“对记忆的主人来说，第一秒就算。对窗口来说，要等有人付出位置才算。”','“To the owner, the first second counts. To the counter, it counts only when someone spends a slot.”')}]:[]),
 ]
 if(id==='clerk')return [
  {id:'capacity',label:tx('为什么我只能留一段？','Why can I keep only one memory?'),reply:tx('“新账户先分到一个长期位。证明自己有稳定需求后，可以申请更多。”她说得像在解释一项优惠。','“New accounts begin with one long-term slot. You may apply for more after proving stable need.” She says it like a benefit.')},
  {id:'borrower',label:tx('谁在借用这些记忆？','Who borrows these memories?'),reply:tx('“需要连续感的人。研究者、长期账户、也包括害怕自己变得空白的人。”她没有说他们付出了什么。','“People who need continuity. Researchers, long-lived accounts, and those afraid of becoming blank.” She does not say what they pay.')},
  ...(share?[share]:[]),
  ...(f.previewLogRead?[{id:'consent',label:tx('授权空白为什么还能预览？','Why preview with blank consent?'),reply:tx('“预览被归类为匹配，不是使用。”她停了一下，“这是流程定义，不是我写的。”','“Preview is classified as matching, not use.” She pauses. “That definition belongs to the process, not to me.”')}]:[]),
 ]
 return []
}

const followups:Record<string,[string,string,string,string,string][]>={
 neighbor:[
 ['arrival','为什么后来不再确认？','Why did you stop checking?','“确认本身也会变成每天要留住的东西。我开始把今天做过的事讲给别人听。”','“Checking becomes another thing to preserve. I started telling people what I did today.”'],
 ['arrival-follow','别人记得，就能代替你记得吗？','Can someone else remembering replace your memory?','“不能。但有人能告诉我，我不是今天才开始存在的。那让我敢出门。”','“No. But someone can tell me I existed before today. That helps me leave my room.”']],
 caretaker:[
 ['authority','那为什么还守在这里？','Why stay at this post, then?','“权限少，不等于什么都不用做。我至少可以把拒绝的理由写下来，不让它消失。”','“Limited authority is no excuse to do nothing. I can at least record why I object, so it does not disappear.”'],
 ['authority-follow','记录也被退回了怎么办？','What if they reject the record too?','“保留原件，再找另一份独立记录。别让一个人的保证成为你唯一的依据。”','“Keep the original and find an independent record. One person’s assurance should not be your only basis.”']],
 clerk:[
 ['capacity','谁判断什么叫稳定需求？','Who decides what counts as stable need?','“申请会进入评估。”她把表格扶正，“我能解释申请流程，不能替你保证名额。”','“Applications go for assessment.” She straightens the form. “I can explain the process, not promise a slot.”'],
 ['capacity-follow','申请的时候，暂存记忆怎么办？','What happens to temporary memories while I apply?','“暂存不是长期保存的承诺。”她终于看向你，“决定借出以前，先读清楚那三十天。”','“Temporary holding is not a promise of preservation.” She finally looks at you. “Read the thirty-day condition before you lend.”']]
}
export function conversationTopics(id:EntityId,save:StorySave,history?:ConversationHistory){
 const catalog=(locale:StorySave['locale'])=>{
  const base=topicCatalog(id,{...save,locale});if(!base.length)return []
  return [...base,...(followups[id]??[]).map(([parent,zh,en,zr,er])=>({id:parent+'-follow',label:locale==='zh'?zh:en,reply:locale==='zh'?zr:er,after:parent+'@base'}))]
 }
 const zh=catalog('zh'),en=catalog('en'),current=catalog(save.locale)
 const variant=(topic:string)=>topic==='share-findings'?(save.facts.previewLogRead?'preview-log':'records'):topic==='preview'?(save.facts.previewTraced?'traced':'masked'):'base'
 const nodes=current.map((topic,i)=>({...topic,key:topic.id+'@'+variant(topic.id),after:'after' in topic?topic.after as string:undefined,aliases:[{question:zh[i].label,reply:zh[i].reply},{question:en[i].label,reply:en[i].reply}]}))
 const turns=history?.turns.filter(t=>t.characterId===id)??[]
 const pairs=turns.filter(t=>t.speaker==='player').flatMap(q=>{const a=turns.find(t=>t.id===q.id.replace(/:player$/,':character'));return a?[{question:q.text,reply:a.text,topicKey:a.topicKey}]:[]})
 return availableTopics(nodes,pairs)
}
