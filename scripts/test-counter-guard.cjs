const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'patches/helper-release');
const runtime=fs.readFileSync(path.join(root,'patches/counter-guard-runtime.js'),'utf8');
const panel=fs.readFileSync(path.join(dir,'index-CAndEweT.patched.mjs'),'utf8');
const settings=fs.readFileSync(path.join(dir,'index-DH_DNc-i.patched.mjs'),'utf8');
function functionCode(source,name){let found;traverse(babelParse(source,'production.mjs',true),{FunctionDeclaration(p){if(p.node.id.name===name){assert(!found,'Ambiguous '+name);found=source.slice(p.node.start,p.node.end)}}});assert(found,'Missing '+name);return found}
const action=functionCode(panel,'Yp'),button=functionCode(settings,'As');
assert(panel.includes(runtime),'Tests must exercise the runtime embedded in the actual payload');
assert(action.includes('__wtBoostLocalClicks(e.delta)'),'Actual panel dispatch must use the guard');
assert(settings.includes('disabled:__wtBoostUi.value'),'Actual button must expose its cooldown');
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
function fixture(){
 let now=0,nextId=0;const timers=new Map(),calls={add:0,local:0,cumulative:[],snapshots:[],errors:0};
 const context={performance:{now:()=>now},setTimeout:(f,delay)=>{const id=++nextId;timers.set(id,{f,at:now+delay});return id},clearTimeout:id=>timers.delete(id),
  console:{warn:()=>calls.errors++},ge:{value:true},A:{isLoggedIn:true,userInfo:{cuid:'account-A'},localClickCount:0,
   get cumulativeClickCount(){return this.localClickCount+42},addLocalClickCount(n){calls.add++;this.localClickCount+=n}},
  Rn:async()=>{calls.local++},ki:async(count,cuid)=>{calls.cumulative.push({count,cuid})},
  fc:()=>{const snapshot={count:context.A.localClickCount};calls.snapshots.push(snapshot);return snapshot},wu:async()=>{}};
 vm.createContext(context);vm.runInContext(runtime+'\n'+action+';this.boost=e=>Yp({type:"boost-local-clicks",delta:e});this.refresh=tt;this.dispose=__wtDisposeCounter;',context);
 async function advance(ms){now+=ms;for(let i=0;i<30;i++){const due=[...timers].filter(([,t])=>t.at<=now);if(!due.length)break;for(const[id,t]of due){timers.delete(id);t.f()}await settle()}}
 return{context,calls,timers,advance};
}
async function main(){
 const checks=[];
 let f=fixture();for(let i=0;i<100;i++)f.context.boost(10000);await settle();
 assert.equal(f.calls.add,1);assert.equal(f.calls.local,1);assert.equal(f.calls.cumulative.length,1);assert.equal(f.context.A.localClickCount,10000);
 await f.advance(499);f.context.boost(10000);await settle();assert.equal(f.calls.add,1);
 await f.advance(1);f.context.boost(10000);await settle();assert.equal(f.calls.add,2);checks.push('100-event burst accepts one boost; the 500ms boundary permits the next');
 f=fixture();for(let i=0;i<1000;i++){f.context.boost(10000);await settle();await f.advance(10)}assert.equal(f.calls.add,20);assert.equal(f.calls.local,20);checks.push('Ten seconds at 100Hz starts 20 bounded saves');
 f=fixture();const slow=deferred();f.context.Rn=()=>{f.calls.local++;return slow.promise};f.context.boost(10000);
 for(let i=0;i<1000;i++){await f.advance(10);f.context.boost(10000)}assert.equal(f.calls.local,1);assert.equal(f.calls.add,1);
 f.context.A.localClickCount+=7;slow.resolve();await settle();assert.equal(f.calls.cumulative[0].count,10049);
 f.context.boost(10000);await settle();assert.equal(f.calls.add,2);checks.push('Stalled local save has one job and no click queue; cumulative save reads the latest count');
 f=fixture();const cumulative=deferred();f.context.ki=(count,cuid)=>{f.calls.cumulative.push({count,cuid});return cumulative.promise};
 f.context.boost(10000);await settle();await f.advance(5000);f.context.boost(10000);assert.equal(f.calls.add,1);cumulative.resolve();await settle();f.context.boost(10000);await settle();assert.equal(f.calls.add,2);checks.push('Cumulative storage is covered by the same execution lock');
 f=fixture();const login=deferred();f.context.Rn=()=>login.promise;f.context.boost(10000);f.context.A.userInfo={cuid:'account-B'};login.resolve();await settle();assert.equal(f.calls.cumulative.length,0);checks.push('Account switch during a save never binds the old boost to the new account');
 f=fixture();f.context.A.isLoggedIn=false;f.context.boost(10000);await settle();assert.equal(f.calls.local,1);assert.equal(f.calls.cumulative.length,0);checks.push('Logged-out boost remains local');
 f=fixture();for(const delta of [NaN,Infinity,-1,0,1,'10000',null,1e9])f.context.boost(delta);await settle();assert.equal(f.calls.add,0);checks.push('Malformed or unexpected deltas start no work');
 f=fixture();f.context.Rn=async()=>{throw Error('storage unavailable')};f.context.boost(10000);await settle();assert.equal(f.calls.errors,1);await f.advance(500);f.context.Rn=async()=>{f.calls.local++};f.context.boost(10000);await settle();assert.equal(f.calls.local,1);checks.push('Rejected storage releases the lock without an unhandled rejection');
 f=fixture();const emit=deferred();f.context.wu=()=>emit.promise;
 for(let i=0;i<1000;i++)f.context.refresh();assert.equal(f.calls.snapshots.length,1);assert.equal(f.timers.size,0);
 f.context.A.localClickCount=54321;emit.resolve();await settle();assert.equal(f.timers.size,1);await f.advance(200);
 assert.equal(f.calls.snapshots.length,2);assert.equal(f.calls.snapshots[1].count,54321);checks.push('1000 refreshes while emit is stalled create one in-flight snapshot and one latest-value refresh');
 f=fixture();for(let i=0;i<1000;i++){f.context.refresh();await settle();await f.advance(10)}assert(f.calls.snapshots.length<=51);checks.push('Inventory serialization is bounded to five ordinary panel snapshots per second');
 f=fixture();f.context.refresh();await settle();f.context.refresh();f.context.ge.value=false;await f.advance(200);assert.equal(f.calls.snapshots.length,1);f.context.ge.value=true;f.context.refresh();await settle();assert.equal(f.calls.snapshots.length,2);
 f.context.refresh();f.context.dispose();assert.equal(f.timers.size,0);await f.advance(500);f.context.refresh();assert.equal(f.calls.snapshots.length,2);checks.push('Closed panel skips snapshots; reopening sends current state; disposal cancels scheduled work');
 f=fixture();f.context.wu=async()=>{throw Error('emit failed')};f.context.refresh();await settle();await f.advance(200);f.context.wu=async()=>{};f.context.refresh();await settle();assert.equal(f.calls.snapshots.length,2);checks.push('Emit failure releases the refresh lock');
 const sent=[],ui={I:value=>({value}),cl:10000,de:async e=>sent.push(e),setTimeout:f=>{ui.unlock=f},console:{warn:()=>{}}};
 vm.createContext(ui);vm.runInContext('const __wtBoostUi=I(false);'+button+';this.click=As;this.busy=__wtBoostUi;',ui);
 await Promise.all(Array.from({length:100},()=>ui.click()));assert.equal(sent.length,1);assert.equal(ui.busy.value,true);ui.unlock();await ui.click();assert.equal(sent.length,2);ui.unlock();
 ui.de=async()=>{throw Error('dispatch failed')};await ui.click();ui.unlock();assert.equal(ui.busy.value,false);checks.push('Actual settings handler suppresses repeated IPC and recovers after a dispatch error');
 const result={passed:true,checks,productionPanelDispatch:true,productionSettingsHandler:true,realMouseInjectionTested:false,realNativeHangReproduced:false,networkRequestsMade:false};
 fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/counter-guard-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
