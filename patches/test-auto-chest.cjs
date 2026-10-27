const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const runtime=fs.readFileSync(path.join(__dirname,'auto-chest-runtime.js'),'utf8');
const settings=fs.readFileSync(path.join(__dirname,'auto-chest-settings.js'),'utf8');
function fixture(){
  const storage=new Map();let now=100000;const calls=[];let pending;
  const context={
    localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
    R:{isLoggedIn:true,totalClickCount:2000},Me:()=>false,Co:{value:false},nt:{value:{status:'online'}},
    As:1000,qn:{value:true},Un:{value:true},Date:{now:()=>now},console:{warn:()=>{}},
    zl:async side=>{calls.push(side);context[side==='left'?'qn':'Un'].value=false;context.R.totalClickCount-=1000;}
  };
  vm.createContext(context,{codeGeneration:{strings:false,wasm:false}});
  vm.runInContext(runtime+';this.tick=__wtAutoChestTick;this.enable=__wtSetAutoChest;',context,{timeout:1000});
  return {context,calls,storage,setNow:n=>now=n,setPending:()=>{context.zl=side=>{calls.push(side);return new Promise(resolve=>pending=resolve);};return()=>pending();}};
}
(async()=>{
  const checks=[];
  let f=fixture();await f.context.tick();assert.equal(f.calls.length,0);checks.push('Disabled by default');
  f.context.enable(true);await f.context.tick();f.setNow(101999);await f.context.tick();assert.equal(f.calls.length,0);f.setNow(102000);await f.context.tick();await f.context.tick();assert.deepEqual(f.calls,['left','right']);assert.equal(f.context.R.totalClickCount,0);checks.push('Waits at least 2 seconds after readiness; both due chests then claimed sequentially');
  for(const condition of ['logged-out','offline','insufficient-clicks','update-lock','manual-claim-active','not-due']){
    f=fixture();f.context.enable(true);
    if(condition==='logged-out')f.context.R.isLoggedIn=false;
    if(condition==='offline')f.context.nt.value.status='offline';
    if(condition==='insufficient-clicks')f.context.R.totalClickCount=999;
    if(condition==='update-lock')f.context.Me=()=>true;
    if(condition==='manual-claim-active')f.context.Co.value=true;
    if(condition==='not-due'){f.context.qn.value=false;f.context.Un.value=false;}
    await f.context.tick();f.setNow(102000);await f.context.tick();assert.equal(f.calls.length,0,condition);
    checks.push('No request: '+condition);
  }
  f=fixture();f.context.enable(true);await f.context.tick();f.setNow(102000);const release=f.setPending();const first=f.context.tick();await f.context.tick();await f.context.tick();assert.equal(f.calls.length,1);release();await first;checks.push('Only one in-flight automatic claim');
  f=fixture();f.context.enable(true);f.context.Un.value=false;f.context.zl=async side=>{f.calls.push(side);throw new Error('simulated transport error')};
  await f.context.tick();f.setNow(102000);await f.context.tick();f.setNow(131999);await f.context.tick();assert.equal(f.calls.length,1);f.setNow(132000);await f.context.tick();assert.equal(f.calls.length,2);checks.push('Failed request waits 30 seconds before retry');
  f=fixture();f.context.enable(true);f.context.Un.value=false;f.context.zl=async side=>{f.calls.push(side)};await f.context.tick();f.setNow(102000);await f.context.tick();await f.context.tick();assert.equal(f.calls.length,1);checks.push('Handler returning without a cooldown update is also backed off');
  f=fixture();f.context.enable(true);f.context.Un.value=false;await f.context.tick();f.setNow(101000);f.context.qn.value=false;await f.context.tick();f.setNow(102000);f.context.qn.value=true;await f.context.tick();f.setNow(103999);await f.context.tick();assert.equal(f.calls.length,0);f.setNow(104000);await f.context.tick();assert.equal(f.calls.length,1);checks.push('New cooldown resets the two-second grace period');
  f=fixture();f.context.enable(true);await f.context.tick();f.setNow(102000);f.context.R.totalClickCount=0;await f.context.tick();assert.equal(f.calls.length,0);checks.push('Rechecks click balance after the delay');
  f=fixture();f.context.enable(true);f.context.enable(false);await f.context.tick();assert.equal(f.calls.length,0);checks.push('Disabling prevents subsequent claims');
  const events=[];const ui={localStorage:{getItem:()=>null},w:v=>({value:v}),de:async e=>events.push(JSON.parse(JSON.stringify(e))),He:()=>{},console:{warn:()=>{}}};
  vm.createContext(ui);vm.runInContext(settings+';this.toggle=__wtToggleAutoChest;this.enabled=__wtAutoChestUi;',ui,{timeout:1000});
  await ui.toggle();assert.equal(ui.enabled.value,true);await ui.toggle();assert.equal(ui.enabled.value,false);assert.deepEqual(events,[{type:'set-auto-claim-chests',enabled:true},{type:'set-auto-claim-chests',enabled:false}]);checks.push('Settings toggle sends correct enable and disable events');
  const result={passed:true,checks,networkRequestsMade:false};
  fs.writeFileSync(path.join(__dirname,'auto-chest-tests.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
