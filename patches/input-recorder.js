// Only the nine explicitly selected game controls can enter a recording.
const __wtInputRecorder=(()=>{
 const allowed=Object.freeze(['1','2','3','Q','E','R','Space','MouseLeft','MouseRight']);
 function normalize(raw){
  const text=String(raw&&typeof raw==='object'?(raw.code??raw.key??''):raw??'');
  if(text===' ')return 'Space';
  const digit=text.match(/^(?:Digit|Numpad|Num|Key)?([123])$/i);if(digit)return digit[1];
  if(/^(?:Key)?[a-z]$/i.test(text))return text.slice(-1).toUpperCase();
  if(/^(space|spacebar)$/i.test(text))return 'Space';
  if(/^(mouseleft|left)$/i.test(text))return 'MouseLeft';
  if(/^(mouseright|right)$/i.test(text))return 'MouseRight';
  return '';
 }
 function create({clock=()=>performance.now(),date=()=>new Date().toISOString(),limit=50000}={}){
  const held=new Set(),recorded=new Map();let active=false,events=[],startTime=0,lastTime=0,startedAt='',last=null;
  const time=()=>{const value=Number(clock());lastTime=Math.max(lastTime,Number.isFinite(value)?value:startTime);return Math.round(Math.max(0,lastTime-startTime)*1000)/1000};
  function append(key,action,at,extra={}){
   const event={index:events.length+1,time_ms:at,device:key.startsWith('Mouse')?'mouse':'keyboard',key,action,...extra};events.push(event);return event;
  }
  function start(){
   if(active)return false;
   startTime=Number(clock());lastTime=startTime;startedAt=date();events=[];recorded.clear();last=null;active=true;return true;
  }
  function stop(reason='user'){
   if(!active)return last;
   const at=time();
   for(const[key,down]of recorded)append(key,'release',at,{hold_ms:Math.max(0,Math.round((at-down)*1000)/1000),synthetic:true,reason:'recording_stopped'});
   recorded.clear();active=false;
   last={schema:'wuwatappo-helper-input-v1',name:'鸣潮专属',started_at:startedAt,duration_ms:at,time_basis:'application_monotonic_event_arrival',allowed_keys:[...allowed],stop_reason:reason,events:events.map(event=>({...event}))};
   return last;
  }
  function input(raw,down,{capture=true}={}){
   const key=normalize(raw);if(!key)return false;
   if(down){
    if(held.has(key))return false;held.add(key);
    if(active&&capture&&allowed.includes(key)){
     if(events.length>=limit){stop('event_limit');return true}
     const at=time();append(key,'press',at);recorded.set(key,at);
    }
   }else{
    if(!held.delete(key))return false;
    // A release for a key held before Start is deliberately not an orphan event.
    if(active&&recorded.has(key)){
     const at=time(),pressedAt=recorded.get(key);append(key,'release',at,{hold_ms:Math.max(0,Math.round((at-pressedAt)*1000)/1000)});recorded.delete(key);
     if(events.length>=limit)stop('event_limit');
    }
   }
   return true;
  }
  function clear(){stop('cleared');held.clear();recorded.clear();events=[];last=null}
  return {start,stop,input,clear,get active(){return active},get held(){return new Set(held)},get count(){return events.length},get duration(){return active?time():last?.duration_ms??0},get last(){return last}};
 }
 function csv(recording){
  const fields=['index','time_ms','device','key','action','hold_ms','synthetic','reason'];
  const cell=value=>{const text=value==null?'':String(value);return /[",\r\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text};
  return '\uFEFF'+[fields.join(','),...recording.events.map(event=>fields.map(key=>cell(event[key])).join(','))].join('\r\n')+'\r\n';
 }
 return {allowed,normalize,create,csv};
})();
export {__wtInputRecorder};
