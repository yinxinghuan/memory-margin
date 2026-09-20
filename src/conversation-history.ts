export type ConversationTurn={id:string;characterId:string;speaker:'player'|'character';text:string;createdAt:number}
export type ConversationHistory={version:1;turns:ConversationTurn[]}

export function emptyConversationHistory():ConversationHistory{return {version:1,turns:[]}}

export function appendConversationTurn(history:ConversationHistory,turn:ConversationTurn,maxTurns=24):ConversationHistory{
 if(!turn.id||!turn.characterId||!turn.text.trim())throw new Error('conversation turn requires id, characterId and text')
 if(history.turns.some(item=>item.id===turn.id))return history
 return {version:1,turns:[...history.turns,turn].slice(-Math.max(2,maxTurns))}
}

export function characterConversation(history:ConversationHistory,characterId:string,limit=8){
 return history.turns.filter(turn=>turn.characterId===characterId).slice(-Math.max(1,limit))
}
