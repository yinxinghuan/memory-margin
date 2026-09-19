import type {EntityId} from './world'
import type {StorySave} from './story'
import {t} from './story'

export type ConversationTopic={id:string;label:string;reply:string}

const known=(save:StorySave,id:EntityId)=>id==='neighbor'?Boolean(save.facts.neighborMet):id==='caretaker'?Boolean(save.facts.caretakerMet):id==='clerk'?Boolean(save.facts.clerkMet):false

export function conversationName(id:EntityId,save:StorySave){
 return id==='neighbor'?t(save.locale,'安禾','Anhe'):id==='caretaker'?t(save.locale,'骆叔','Luo'):id==='clerk'?t(save.locale,'乔弥','Qiaomi'):''
}

export function conversationTopics(id:EntityId,save:StorySave):ConversationTopic[]{
 if(!known(save,id))return []
 const tx=(zh:string,en:string)=>t(save.locale,zh,en),f=save.facts
 const share=f.previewLogRead?{id:'share-findings',label:tx('说说六秒预览记录','Share the six-second preview log'),reply:id==='neighbor'?tx('安禾把时间戳抄在面包袋背面：“这能证明不是你记错了。昨夜窗口确实先于你的同意响过。”','Anhe copies the timestamp onto the bread bag. “This proves you did not misremember it. The counter played before you consented.”'):id==='caretaker'?tx('骆叔把播放记录和退回的投诉并排：“封签只拦住代签。窗口把同一件事换了名字。”','Luo places the playback log beside his rejected complaint. “The seal stopped the signature. The counter renamed the same act.”'):tx('乔弥看完记录，没有再说这是适应期错觉：“时间戳是真的。争议只剩下系统把它叫不叫使用。”','Qiaomi reads the log and stops calling it adjustment. “The timestamp is real. The dispute is whether the system calls it use.”')}:(f.receiptRead||f.sealRead||f.ledgerRead)?{id:'share-findings',label:tx('分享我查到的记录','Share what I found'),reply:id==='neighbor'?tx('安禾逐行看完：“授权空白，却已经进了待借用。你最好把每一张记录都留着。”','Anhe reads each line. “Blank consent, but already queued for lending. Keep every record you find.”'):id==='caretaker'?tx('骆叔只点了一下 23:16：“把这个时间和窗口下一条记录对上。别只听我们谁说得像真的。”','Luo taps 23:16 once. “Match this time against the next counter record. Do not decide by who sounds convincing.”'):tx('乔弥把回执推回来：“单张记录不能说明流程全貌。你可以继续看公开使用记录。”','Qiaomi returns the receipt. “One document does not show the whole process. You may inspect the public use register.”')}:null
 if(id==='neighbor')return [
  {id:'arrival',label:tx('你转生多久了？','How long since your transfer?'),reply:tx('“三个月。前两周我每天醒来都要确认一次，昨天的我有没有被系统清掉。后来不确认了，不代表我放心了。”','“Three months. For two weeks I checked every morning whether yesterday’s me had been cleared. I stopped checking. That does not mean I feel safe.”')},
  {id:'help',label:tx('你为什么帮我？','Why are you helping me?'),reply:tx('“因为我听见过你的声音。也因为下一次被当成公共样本的，可能是我的。”她没有把面包收回去。','“Because I heard your voice. And because mine may be the next one treated as a public sample.” She does not take the bread back.')},
  ...(share?[share]:[]),
  ...(f.neighborPreview?[{id:'preview',label:tx('昨夜还有谁在走廊？','Who else was in the hall?'),reply:tx(f.previewTraced?'“我只看见窗口亮起 C-09。那不是住户编号，更像长期账户。”':'“送餐车、骆叔，还有窗口后面的人。收听账户被遮住了，我认不出是谁。”',f.previewTraced?'“I only saw C-09 light up. That is not a resident number. It looks like a long-lived account.”':'“The breakfast cart, Luo, and whoever was behind the counter. The listener account was masked.”')}]:[]),
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

export function freeConversationReply(id:EntityId,save:StorySave,input:string){
 const tx=(zh:string,en:string)=>t(save.locale,zh,en),value=input.trim()
 if(!known(save,id))return tx('先和对方正式打招呼。','Introduce yourself first.')
 if(/记忆|memory|slot|位置/i.test(value))return conversationTopics(id,save).find(topic=>topic.id==='capacity')?.reply??tx('“记忆的位置从来不只是容量问题，还要看谁有权决定。”','“A memory slot is never only about capacity. It is about who gets to decide.”')
 if(/预览|六秒|声音|preview|six|voice/i.test(value))return conversationTopics(id,save).find(topic=>topic.id==='consent'||topic.id==='six-seconds'||topic.id==='preview')?.reply??tx('“先把窗口的播放记录找出来。口头解释会变，时间戳不会。”','“Find the playback log first. Explanations change; timestamps do not.”')
 if(/害怕|担心|怕|afraid|worried/i.test(value))return id==='clerk'?tx('“不安是转生适应期的常见反应。签字以后，很多人会轻松一点。”','“Unease is common during transfer adjustment. Many people feel lighter after signing.”'):tx('“你不用现在证明自己不害怕。先把发生过的事弄清楚。”','“You do not have to prove you are unafraid. First learn what happened.”')
 return id==='neighbor'?tx('“我不确定。但你愿意问，就先别让别人替你回答。”','“I am not sure. But since you asked, do not let someone else answer for you.”'):id==='caretaker'?tx('“我只说亲眼见过的。去查记录，别猜。”','“I only speak to what I saw. Check the record. Do not guess.”'):tx('“这个问题不在标准说明里。你可以查阅公开记录，再决定是否继续。”','“That question is outside the standard guide. Read the public record before you continue.”')
}
