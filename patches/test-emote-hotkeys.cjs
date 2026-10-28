const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const config=require('./patch-config.json'),source=fs.readFileSync(path.join(__dirname,'assets',path.basename(config.panelAsset)),'utf8');
let originalSend;traverse(babelParse(source,'panel.mjs',true),{FunctionDeclaration(p){if(p.node.id?.name==='_p'){assert(!originalSend);originalSend=source.slice(p.node.start,p.node.end)}}});assert(originalSend);
const saved=new Map(),sent=[],stats=[],toasts=[],handlers=new Map();let now=10000,locked=false;
const ctx={localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},Date:{now:()=>now},emit:async()=>{},console,
 Ie:()=>locked,Fa:{value:Array.from({length:6},(_,i)=>({id:101+i,name:'slot-'+(i+1)+'.png'}))},yt:m=>toasts.push(m),te:p=>'asset://'+p,
 A:{isLoggedIn:true},th:id=>sent.push(id),J:()=>({rarity:'Rare'}),_m:e=>stats.push(e),Ff:()=>({offsetX:1,offsetY:2}),_t:{value:[]},Ad:0,mn:()=>{},pt:async(n,fn)=>{handlers.set(n,fn);return()=>handlers.delete(n)}};
const core=fs.readFileSync(path.join(__dirname,'hotkeys-core.js'),'utf8').replace('export{__wtHotkeys};','this.hk=__wtHotkeys;');
vm.createContext(ctx);vm.runInContext(core+originalSend+fs.readFileSync(path.join(__dirname,'hotkeys-runtime.js'),'utf8')+';this.perform=__wtPerformHotkey;this.slot=__wtSendEmoteSlot;this.install=__wtInstallHotkeys;',ctx);
(async()=>{
 const hk=ctx.hk;assert.equal(hk.actions.length,11);await ctx.install();
 for(let i=1;i<=6;i++){now+=500;hk.nativeDown('ControlLeft');hk.nativeDown('AltLeft');const action=hk.nativeDown('Digit'+i);assert.equal(action,'emote'+i);ctx.perform(action);handlers.get('wt-hotkey-action')({payload:{action}});assert.equal(hk.nativeDown('Digit'+i),null);hk.nativeUp('Digit'+i);hk.nativeUp('AltLeft');hk.nativeUp('ControlLeft')}
 assert.deepEqual(sent,[101,102,103,104,105,106]);assert.equal(stats.length,6);assert.equal(ctx._t.value.length,6);assert.equal(ctx._t.value[5].src,'asset://emote/slot-6.png');
 ctx.Fa.value[0]={id:999,name:'changed.png'};now+=500;ctx.perform('emote1');assert.equal(sent.at(-1),999);
 const count=sent.length;ctx.Fa.value[5]=null;now+=500;ctx.perform('emote6');assert.equal(sent.length,count);assert(toasts.at(-1).includes('6'));
 ctx.slot(0);ctx.slot(7);ctx.slot(1.5);locked=true;now+=500;ctx.perform('emote2');assert.equal(sent.length,count);locked=false;
 handlers.get('wt-hotkey-capture')({payload:{owner:'settings',enabled:true}});ctx.perform('emote2');assert.equal(sent.length,count);handlers.get('wt-hotkey-capture')({payload:{owner:'settings',enabled:false}});
 ctx.document={hasFocus:()=>true,activeElement:{isContentEditable:true}};ctx.perform('emote2');assert.equal(sent.length,count);delete ctx.document;
 ctx.A.isLoggedIn=false;now+=500;ctx.perform('emote2');assert.equal(sent.length,count);assert.equal(ctx._t.value.length,8);ctx.A.isLoggedIn=true;
 const legacy={game:'Ctrl+Alt+1',monitor:'F8',visibility:'F9',reload:'F5',record:'Ctrl+Alt+F10'};saved.set('wuwatappo-hotkeys-v1',JSON.stringify(legacy));assert.equal(hk.read().game,'Ctrl+Alt+1');assert.equal(hk.read().emote1,'');assert.equal(hk.read().emote2,'Ctrl+Alt+2');
 assert(hk.validate({...hk.defaults(),emote2:'Ctrl+Alt+1'}).errors.length);assert.equal(hk.save({...hk.defaults(),emote1:'Shift+F1',emote6:''}).errors.length,0);assert.equal(hk.fromEvent({code:'F1',shiftKey:true}),'emote1');assert.equal(hk.fromEvent({code:'Digit6',ctrlKey:true,altKey:true}),null);
 const report={passed:true,usesOriginalMouseSendHandler:true,checks:['Six native shortcuts send their current slots without opening the menu','Local bubble, normal room-send path and original item event share the mouse handler','Native/DOM duplicate events and key repeat do not double-send','Equipment changes are read at trigger time','Empty slots, update lock, settings capture and editable focus are guarded','Offline behaviour matches original local-only display','Legacy custom bindings survive new-default collisions','Six bindings can be changed, disabled and checked for conflicts'],realServerRequestsMade:false,realAccountEmoteDeliveryTested:false};
 fs.writeFileSync(path.join(__dirname,'emote-hotkey-tests.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
