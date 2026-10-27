const __wtHotkeyCaptureOwners=new Map();
let __wtHotkeyStopAction=null,__wtHotkeyStopCapture=null;
const __wtHotkeyLast=new Map();
function __wtPerformHotkey(action){
 const capturedNow=Date.now();for(const[owner,until]of __wtHotkeyCaptureOwners)if(until<=capturedNow)__wtHotkeyCaptureOwners.delete(owner);
 if(!__wtHotkeys.actions.some(item=>item.id===action)||__wtHotkeyCaptureOwners.size||Me())return;
 if(typeof document!=="undefined"&&document.hasFocus()&&__wtHotkeys.editable(document.activeElement))return;
 const now=Date.now();if(now-(__wtHotkeyLast.get(action)??-Infinity)<400)return;
 __wtHotkeyLast.set(action,now);
 if(action==="visibility")$l();
 else if(action==="game")ah();
 else if(action==="monitor"){if(cv())uv()}
 else if(action==="reload")Sn().finally(Wg);
}
function __wtNativeHotkeyDown(raw){const action=__wtHotkeys.nativeDown(raw);if(action)__wtPerformHotkey(action)}
function __wtNativeHotkeyUp(raw){__wtHotkeys.nativeUp(raw)}
async function __wtInstallHotkeys(){
 __wtHotkeyStopAction=await mt("wt-hotkey-action",event=>__wtPerformHotkey(event.payload?.action));
 __wtHotkeyStopCapture=await mt("wt-hotkey-capture",event=>{const owner=String(event.payload?.owner??"default");event.payload?.enabled?__wtHotkeyCaptureOwners.set(owner,Date.now()+120000):__wtHotkeyCaptureOwners.delete(owner)});
}
function __wtDisposeHotkeys(){__wtHotkeyStopAction?.();__wtHotkeyStopCapture?.()}
