const __wtHotkeyCaptureOwners=new Map();
let __wtHotkeyStopAction=null,__wtHotkeyStopCapture=null;
const __wtHotkeyLast=new Map();
function __wtSendEmoteSlot(slot){
 if(Ie()||!Number.isInteger(slot)||slot<1||slot>6)return;
 const item=Fa.value[slot-1];
 if(!item||!Number.isFinite(item.id)||item.id<=0||typeof item.name!=="string"||!item.name.trim()){yt("表情槽位 "+slot+" 未配置");return}
 _p({id:item.id,src:te("emote/"+item.name)});
}
function __wtPerformHotkey(action){
 const capturedNow=Date.now();for(const[owner,until]of __wtHotkeyCaptureOwners)if(until<=capturedNow)__wtHotkeyCaptureOwners.delete(owner);
 if(!__wtHotkeys.actions.some(item=>item.id===action)||__wtHotkeyCaptureOwners.size||Ie())return;
 if(typeof document!=="undefined"&&document.hasFocus()&&__wtHotkeys.editable(document.activeElement))return;
 const now=Date.now();if(now-(__wtHotkeyLast.get(action)??-Infinity)<400)return;
 __wtHotkeyLast.set(action,now);
 if(action==="visibility")dc();
 else if(action==="game")Sh();
 else if(action==="monitor"){if(Iv())Mv()}
 else if(action==="reload")Rn().finally(ly);
 else if(action==="record"&&typeof __wtKeyboard!=="undefined")__wtKeyboard.toggle();
 else if(/^emote[1-6]$/.test(action))__wtSendEmoteSlot(Number(action.slice(5)));
}
function __wtNativeHotkeyDown(raw){const action=__wtHotkeys.nativeDown(raw);if(action)__wtPerformHotkey(action);return action}
function __wtNativeHotkeyUp(raw){__wtHotkeys.nativeUp(raw)}
async function __wtInstallHotkeys(){
 __wtHotkeyStopAction=await pt("wt-hotkey-action",event=>__wtPerformHotkey(event.payload?.action));
 __wtHotkeyStopCapture=await pt("wt-hotkey-capture",event=>{const owner=String(event.payload?.owner??"default");event.payload?.enabled?__wtHotkeyCaptureOwners.set(owner,Date.now()+120000):__wtHotkeyCaptureOwners.delete(owner)});
}
function __wtDisposeHotkeys(){__wtHotkeyStopAction?.();__wtHotkeyStopCapture?.()}
