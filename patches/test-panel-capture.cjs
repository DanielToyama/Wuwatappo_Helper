const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const guard=fs.readFileSync(path.join(__dirname,'panel-open-guard.js'),'utf8');
const calls=[];let skip=false;
const ctx={_:async(name,args)=>{calls.push({name,args:JSON.parse(JSON.stringify(args))});if(name==='set_skip_panel_outside_click_close')skip=args.skip;if(name==='open_panel_window')skip=false;}};
vm.createContext(ctx);vm.runInContext(guard+';this.open=Wt',ctx,{timeout:1000});
(async()=>{
 for(const tab of ['setting','bag','atlas','room','exchange']){
  calls.length=0;await ctx.open(tab);assert.equal(skip,true);
  assert.deepEqual(calls.map(c=>c.name),['set_skip_panel_outside_click_close','open_panel_window','set_skip_panel_outside_click_close']);
  assert.equal(calls[0].args.skip,true);assert.equal(calls[1].args.payload.tab,tab);assert.equal(calls[2].args.skip,true);
 }
 const source=fs.readFileSync(path.join(__dirname,'assets','index-DH_DNc-i.js'),'utf8');
 assert(source.includes('f=>c("close")'));
 const result={passed:true,checks:['Native outside-click-close guard set before and after each panel open','All five panel tabs covered','Existing explicit close control retained'],nativeWindowBehaviorTested:false,networkRequestsMade:false};
 fs.writeFileSync(path.join(__dirname,'panel-capture-tests.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
