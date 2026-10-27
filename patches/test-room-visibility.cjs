const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const runtime=fs.readFileSync(path.join(__dirname,'room-visibility-runtime.js'),'utf8');
const uiCode=fs.readFileSync(path.join(__dirname,'room-visibility-ui.js'),'utf8');
const updates={hover:0,layout:0,panel:0};
const members=[
 {id:1,online:true,dockVisible:true},
 {id:2,online:true,dockVisible:true},
 {id:3,online:true,dockVisible:true},
 {id:4,online:false,dockVisible:true},
 {id:5,online:true,dockVisible:false},
 {id:-1,online:true,dockVisible:true},
 {id:2,online:true,dockVisible:true}
];
const original=JSON.stringify(members);
const ctx={Me:()=>false,So:{value:new Set([3,40])},fe:{value:members},No:member=>member.id===1,
 fd:()=>{ctx.So.value=new Set()},Ao:()=>updates.hover++,en:()=>updates.layout++,tt:()=>updates.panel++};
vm.createContext(ctx,{codeGeneration:{strings:false,wasm:false}});
vm.runInContext(runtime+';this.setVisible=__wtSetAllRoomMembersVisible',ctx,{timeout:1000});
ctx.setVisible(false);assert.deepEqual([...ctx.So.value].sort((a,b)=>a-b),[2,3,40]);
ctx.setVisible(false);assert.deepEqual([...ctx.So.value].sort((a,b)=>a-b),[2,3,40]);
assert(!ctx.So.value.has(1));assert(!ctx.So.value.has(4));assert(!ctx.So.value.has(5));assert(!ctx.So.value.has(-1));
ctx.setVisible(true);assert.equal(ctx.So.value.size,0);ctx.setVisible(true);assert.equal(ctx.So.value.size,0);
assert.equal(JSON.stringify(members),original);assert.deepEqual(updates,{hover:4,layout:4,panel:4});
ctx.Me=()=>true;ctx.setVisible(false);assert.equal(ctx.So.value.size,0);assert.equal(updates.panel,4);
ctx.Me=()=>false;ctx.setVisible('false');assert.equal(ctx.So.value.size,0);assert.equal(updates.panel,4);
const events=[];
const ui={de:async e=>events.push(JSON.parse(JSON.stringify(e))),He:()=>{},console:{warn:()=>{}}};
vm.createContext(ui);vm.runInContext(uiCode+';this.bulk=__wtBulkRoomVisible',ui,{timeout:1000});
(async()=>{
 await ui.bulk(false);await ui.bulk(true);
 assert.deepEqual(events,[{type:'set-room-members-visibility',visible:false},{type:'set-room-members-visibility',visible:true}]);
 for(const event of events)ctx.setVisible(event.visible);
 assert.equal(ctx.So.value.size,0);
 const result={passed:true,checks:[
  'Hide all eligible online peers; exclude self, offline and non-displayed peers',
  'Repeated hide and show actions are idempotent',
  'Show clears local hidden overrides',
  'Duplicate member IDs do not toggle peers back on',
  'Member records and server desktop flags unchanged',
  'Hover, hit regions and room panel refreshed',
  'Forced update lock and invalid values ignored',
  'UI emits one explicit visibility message per button'
 ],networkRequestsMade:false};
 fs.writeFileSync(path.join(__dirname,'room-visibility-tests.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
