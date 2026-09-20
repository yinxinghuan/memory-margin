// Stable source identity. A hosted Remix replaces it with the new session UUID.
export const GAME_ID='b198e25d-5781-48c3-930a-143ed23a92b4'
export function getGameApiBase(){return `/${GAME_ID}`}
export const API_BASE=getGameApiBase()
if(typeof window!=='undefined')window.__GAME_UUID__='b198e25d-5781-48c3-930a-143ed23a92b4'
