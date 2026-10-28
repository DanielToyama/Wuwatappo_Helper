// A session-wide default: new/reconnected peers stay hidden until explicitly shown.
const __wtHideRoomPeers=W(false),__wtShownRoomPeers=W(new Set);
function no(e){return Number.isFinite(e)&&e>0&&e!==Wo.value&&((__wtHideRoomPeers.value&&!__wtShownRoomPeers.value.has(e))||Eo.value.has(e))}
function cl(e,t){const o=new Set(Eo.value),s=new Set(__wtShownRoomPeers.value);t?(o.add(e),s.delete(e)):(o.delete(e),s.add(e));Eo.value=o;__wtShownRoomPeers.value=s}
function Md(){Eo.value.size!==0&&(Eo.value=new Set)}
