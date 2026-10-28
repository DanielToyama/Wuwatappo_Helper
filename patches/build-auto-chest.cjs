const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const withHelperRelease=process.argv.includes('--helper-release');
const withKeyboard=withHelperRelease||process.argv.includes('--keyboard-ui');
const withInventoryShare=process.argv.includes('--inventory-share')||withKeyboard;
const withScreenshotFix=process.argv.includes('--screenshot-fix')||withInventoryShare;
const withHotkeys=process.argv.includes('--hotkeys')||withScreenshotFix;
const withRoomVisibility=process.argv.includes('--room-visibility')||withHotkeys;
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'patch-config.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'extraction-manifest.json'),'utf8'));
config.sourcePath=process.env.WUWA_SOURCE_EXE||config.sourcePath;
const source=fs.readFileSync(config.sourcePath);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(source),config.sourceSha256,'Source is no longer the reviewed 1.0.2 executable');
cp.execFileSync(process.execPath,[path.join(__dirname,'test-auto-chest.cjs')],{stdio:'pipe'});
if(withRoomVisibility)cp.execFileSync(process.execPath,[path.join(__dirname,'test-room-visibility.cjs')],{stdio:'pipe'});
if(withHelperRelease)cp.execFileSync(process.execPath,[path.join(__dirname,'test-room-history.cjs')],{stdio:'pipe'});
if(withHotkeys)cp.execFileSync(process.execPath,[path.join(__dirname,'test-hotkeys.cjs')],{stdio:'pipe'});
if(withScreenshotFix)cp.execFileSync(process.execPath,[path.join(__dirname,'test-panel-capture.cjs')],{stdio:'pipe'});
if(withInventoryShare)cp.execFileSync(process.execPath,[path.join(__dirname,'test-inventory-share.cjs')],{stdio:'pipe'});
if(withKeyboard)cp.execFileSync(process.execPath,[path.join(__dirname,'test-input-recorder.cjs')],{stdio:'pipe'});
const runtime=fs.readFileSync(path.join(__dirname,'auto-chest-runtime.js'),'utf8');
const settingsRuntime=fs.readFileSync(path.join(__dirname,'auto-chest-settings.js'),'utf8');
const outputDir=path.join(__dirname,withHelperRelease?'helper-release':withInventoryShare?'inventory-share':withScreenshotFix?'screenshot-fix':withHotkeys?'hotkeys-test':withRoomVisibility?'combined-test':'auto-chest-test');
fs.mkdirSync(outputDir,{recursive:true});
function replaceOnce(text,from,to){assert.equal(text.split(from).length-1,1,`Ambiguous patch anchor ${from}`);return text.replace(from,to);}
function asset(name){
 const meta=manifest.assets.find(a=>a.name===name);assert(meta,`Missing resource ${name}`);
 const old=source.subarray(meta.offset,meta.offset+meta.compressedBytes);
 const decoded=zlib.brotliDecompressSync(old);
 assert.equal(hash(decoded),meta.sha256);
 assert(decoded.equals(fs.readFileSync(path.join(__dirname,'assets',path.basename(name)))));
 return {meta,text:decoded.toString('utf8')};
}
const settings=asset(config.settingsAsset);
let text=settings.text;
text=replaceOnce(text,config.hiddenAnchor,config.hiddenAnchor.replace("(!1)","(!0)"));
text=replaceOnce(text,"async function As(){}",settingsRuntime+"async function As(){await de({type:\"boost-local-clicks\",delta:cl})}");
const row="e(\"div\",{class:\"setting-item\"},[e(\"div\",{class:\"setting-label\"},[e(\"div\",{class:\"setting-title\"},\"自动领取宝箱\")]),e(\"div\",{class:\"setting-content\"},[e(\"button\",{type:\"button\",class:\"setting-btn\",title:\"冷却归零后至少等待5秒，点击数足够时领取；失败后30秒重试\",onMousedown:U(()=>{},[\"stop\"]),onClick:U(__wtToggleAutoChest,[\"stop\"]),\"aria-pressed\":__wtAutoChestUi.value},__wtAutoChestUi.value?\"已开启\":\"已关闭\",9,[\"aria-pressed\"])])])";
text=replaceOnce(text,"e(\"div\",Bo,[e(\"div\",Oo,[",row+",e(\"div\",Bo,[e(\"div\",Oo,[");
assert(text.includes("cl=1e4"));
if(withRoomVisibility){
 const roomUi=fs.readFileSync(path.join(__dirname,"room-visibility-ui.js"),"utf8");
 text=replaceOnce(text,"const g=x(()=>y.roomMode!==\"idle\");",roomUi+"const g=x(()=>y.roomMode!==\"idle\");");
 const roomButtonStyle="{position:\"static\",display:\"inline-flex\",alignItems:\"center\",justifyContent:\"center\",boxSizing:\"border-box\",height:\"36px\",lineHeight:\"normal\",padding:\"0 12px\",margin:\"0\",minWidth:\"0\",flex:\"1 1 0\",fontSize:\"16px\",fontFamily:\"inherit\",whiteSpace:\"nowrap\",textAlign:\"center\",background:\"#fed291\",color:\"#8e5e43\",border:\"1px solid #E7B77C\",borderRadius:\"18px\",cursor:\"pointer\"}";
 const roomRow="e(\"div\",{class:\"room-bulk-visibility\",style:{display:\"flex\",alignItems:\"center\",width:\"100%\",gap:\"8px\",margin:\"12px 0\"}},[e(\"button\",{type:\"button\",class:\"wt-room-bulk-button\",style:"+roomButtonStyle+",title:\"持续隐藏其他成员，包括后来加入者\",onMousedown:U(()=>{},[\"stop\"]),onClick:U(()=>__wtBulkRoomVisible(false),[\"stop\"])},\"一键不可见\"),e(\"button\",{type:\"button\",class:\"wt-room-bulk-button\",style:"+roomButtonStyle+",title:\"在本机显示其他成员允许展示的桌宠\",onMousedown:U(()=>{},[\"stop\"]),onClick:U(()=>__wtBulkRoomVisible(true),[\"stop\"])},\"一键可见\")])";
 text=replaceOnce(text,"t.roomMembers.length?(l(),m(\"ul\",Ji,",roomRow+",t.roomMembers.length?(l(),m(\"ul\",Ji,");
}
if(withHelperRelease){
 text=replaceOnce(text,'Ki={class:"join-rooms"}','Ki={class:"join-rooms",style:{flexWrap:"wrap"}}');
 text=replaceOnce(text,'class:"join-rooms-input",type:"text"','class:"join-rooms-input",style:{flex:"1 1 120px",minWidth:0},type:"text"');
 text=replaceOnce(text,'Xi={class:"room-number"}','Xi={class:"room-number",style:{flexWrap:"wrap",gap:"6px"}}');
 text=replaceOnce(text,'class:"common-btn leave-room-btn",disabled','class:"common-btn leave-room-btn",style:{top:0,bottom:"auto",height:"30px",fontSize:"14px",padding:"0 12px",lineHeight:"normal",display:"inline-flex",alignItems:"center",justifyContent:"center"},disabled');
 text=replaceOnce(text,'const g=x(()=>y.roomMode!=="idle");',fs.readFileSync(path.join(__dirname,'room-history-settings.js'),'utf8')+'const g=x(()=>y.roomMode!=="idle");');
 text=replaceOnce(text,'L(h(n)("rooms_join")),9,zi)])','L(h(n)("rooms_join")),9,zi),__wtHistoryButton()])');
 text=replaceOnce(text,'e("span",{class:"room-number-copy",role:"button",onClick:E})])','e("span",{class:"room-number-copy",role:"button",onClick:E}),__wtHistoryButton()])');
}
if(withHotkeys){
 text=replaceOnce(text,"const __wtAutoChestUi=", "const __wtKeySettings=__wtHotkeys.createSettings(I,He);const __wtAutoChestUi=");
 text=replaceOnce(text,"e(\"div\",Bo,[e(\"div\",Oo,[","__wtHotkeys.render(e,__wtKeySettings),e(\"div\",Bo,[e(\"div\",Oo,[");
 text=replaceOnce(text,"L(h(n)(\"setting_screen_tips\"))","L(\"快捷键：\"+(__wtHotkeys.read().monitor||\"未设置\"))");
 text=replaceOnce(text,"L(h(n)(\"setting_game_mode_tip\"))","L(\"无宝箱可领取时禁用桌宠交互；快捷键：\"+(__wtHotkeys.read().game||\"未设置\"))");
 if(withKeyboard){
  text=replaceOnce(text,"const __wtKeySettings=__wtHotkeys.createSettings(I,He);","const __wtKeyboardSettings=__wtKeyboardUi.settings(I,He),__wtKeySettings=__wtHotkeys.createSettings(I,He);");
  text=replaceOnce(text,"__wtHotkeys.render(e,__wtKeySettings),","__wtKeyboardUi.renderSettings(e,__wtKeyboardSettings),__wtHotkeys.render(e,__wtKeySettings),");
 }
 text+="\nimport{__wtHotkeys"+(withKeyboard?",__wtKeyboardUi":"")+"}from\"./"+path.basename(config.mainAsset)+"\";\n";
}
if(withInventoryShare){
 text+="\nimport{__wtInventoryShare,__wtNormalPanel}from\"./"+path.basename(config.mainAsset)+"\";\n";
 text=replaceOnce(text,"const y=t,c=q,T=x(()=>{if(!oe.isLoggedIn)",
  "const y=t,c=q,__wtShare=__wtInventoryShare.create(I,()=>({items:y.bagList,host:y.assetsCdnHost,loggedIn:oe.isLoggedIn,loading:y.bagListLoading}),He),T=x(()=>{if(!oe.isLoggedIn)");
 text=replaceOnce(text,"[e(\"div\",ql,[e(\"div\",Xl,[","[__wtInventoryShare.render(e,__wtShare),e(\"div\",ql,[e(\"div\",Xl,[");
 text=replaceOnce(text,"let k,V,z;function O(){requestAnimationFrame(()=>{ro().catch(C=>{console.warn(\"[panel] raise above pets failed\",C)})})}",
  "let k,V,z,__wtNormalizeStop;function O(){requestAnimationFrame(()=>{__wtNormalPanel(y).catch(C=>{console.warn(\"[panel] normal window failed\",C)})})}");
 text=replaceOnce(text,"const C=B.query.tab;","__wtNormalizeStop=await Dn(\"wt-panel-normalize\",()=>O());const C=B.query.tab;");
 text=replaceOnce(text,"pt(()=>{k?.(),V?.(),z?.(),xt()})","pt(()=>{k?.(),V?.(),z?.(),__wtNormalizeStop?.(),xt()})");
}
settings.patched=text;
const panel=asset(config.panelAsset);
assert(!panel.text.includes("__wtAutoChest"));
let panelText=replaceOnce(panel.text,"function Yp(e){",runtime+"function Yp(e){");
panelText=replaceOnce(panelText,"function Yp(e){switch(e.type){","function Yp(e){switch(e.type){case\"set-auto-claim-chests\":typeof e.enabled===\"boolean\"&&__wtSetAutoChest(e.enabled),tt();break;");
panelText=replaceOnce(panelText,"Lr=setInterval(()=>{A.isLoggedIn&&Vn()},1e3)","Lr=setInterval(()=>{A.isLoggedIn&&Vn(),__wtAutoChestTick()},1e3)");
assert(panelText.includes("await km({place:e,click_num:A.cumulativeClickCount})"));
assert(panelText.includes("case\"boost-local-clicks\":"));
assert(panelText.includes("ji=await lv(Yp)"));
if(withRoomVisibility){
 const roomRuntime=fs.readFileSync(path.join(__dirname,"room-visibility-runtime.js"),"utf8");
 panelText=replaceOnce(panelText,'function no(e){return Eo.value.has(e)}function cl(e,t){const o=new Set(Eo.value);t?o.add(e):o.delete(e),Eo.value=o}function Md(){Eo.value.size!==0&&(Eo.value=new Set)}',fs.readFileSync(path.join(__dirname,'room-visibility-policy.js'),'utf8'));
 panelText=replaceOnce(panelText,"function uh(e){",roomRuntime+"function uh(e){");
 panelText=replaceOnce(panelText,"case\"toggle-room-member\":uh(e.memberId);break;",
  "case\"set-room-members-visibility\":__wtSetAllRoomMembersVisible(e.visible);break;case\"toggle-room-member\":uh(e.memberId);break;");
}
if(withHelperRelease){
 panelText=replaceOnce(panelText,'function Ys(n){',fs.readFileSync(path.join(__dirname,'room-history-core.js'),'utf8')+'\nconst __wtRoomHistory=__wtRoomHistoryCore.create();\nfunction Ys(n){');
 panelText=replaceOnce(panelText,'function Yp(e){',fs.readFileSync(path.join(__dirname,'room-history-runtime.js'),'utf8')+'function Yp(e){');
 panelText=replaceOnce(panelText,'a.value=wd(xe?.o)?"owner":"member",We("rd",{r:u.value},at)','a.value=wd(xe?.o)?"owner":"member",xe&&A.isLoggedIn&&__wtRoomHistory.remember(Ee,u.value),We("rd",{r:u.value},at)');
 panelText=replaceOnce(panelText,'case"join-room":dh();break;','case"join-room-history":__wtEnterHistoryRoom(e);break;case"join-room":dh();break;');
 for(const fn of ['fh','dh','ph'])panelText=replaceOnce(panelText,'async function '+fn+'(){','async function '+fn+'(){if(__wtRoomHistory.busy){yt("正在切换房间，请稍候");return}');
 panelText+='\nimport{cL as __wtRoomEmit}from"./'+path.basename(config.mainAsset)+'";\n';
}
if(withHotkeys){
 let hotkeyRuntime=fs.readFileSync(path.join(__dirname,"hotkeys-runtime.js"),"utf8");
 if(withKeyboard)hotkeyRuntime+="\nconst __wtKeyboard=__wtKeyboardUi.create({listen:pt,layout:()=>De(()=>Me()),toClient:Vt,pointer:()=>({x:oe.value,y:de.value}),visible:()=>_.value,hotkeys:__wtHotkeys,blocked:()=>Ie()||[...__wtHotkeyCaptureOwners.values()].some(until=>until>Date.now())});\n";
 panelText=replaceOnce(panelText,"function Fc(e){",hotkeyRuntime+"function Fc(e){");
 panelText=replaceOnce(panelText,"function Fs(n){return Zg.has(n)}","function Fs(n){return false}");
 panelText=replaceOnce(panelText,"function Ls(n){return ny.has(n)}","function Ls(n){return false}");
 panelText=replaceOnce(panelText,"function Bs(n){return iy.has(n)}","function Bs(n){return false}");
 panelText=replaceOnce(panelText,"function Bc(e){",withKeyboard?"function Bc(e){const __wtAction=__wtNativeHotkeyDown(e);__wtKeyboard.key(e,true,{control:__wtAction===\"record\"});":"function Bc(e){__wtNativeHotkeyDown(e);");
 panelText=replaceOnce(panelText,"function Nc(e){","function Nc(e){__wtNativeHotkeyUp(e);"+(withKeyboard?"__wtKeyboard.key(e,false);":""));
 if(withKeyboard)panelText=replaceOnce(panelText,'const ee=j.closest("button");','const ee=j.closest("button,a[download]");');
 if(withKeyboard)panelText=replaceOnce(panelText,"const t=e.payload.button,o=e.payload.action;","const t=e.payload.button,o=e.payload.action;if(t!=='right')__wtKeyboard.mouse(t,o,{x:oe.value,y:de.value});");
 panelText=replaceOnce(panelText,"ji=await lv(Yp),","ji=await lv(Yp),await __wtInstallHotkeys(),"+(withKeyboard?"await __wtKeyboard.mount(),":""));
 panelText=replaceOnce(panelText,"Ri(()=>{mh(),Tc(),","Ri(()=>{"+(withKeyboard?"__wtKeyboard.dispose();":"")+"__wtDisposeHotkeys();mh(),Tc(),");
 panelText+="\nimport{__wtHotkeys"+(withKeyboard?",__wtKeyboardUi":"")+"}from\"./"+path.basename(config.mainAsset)+"\";\n";
}
panel.patched=panelText;
const resources=[settings,panel];
if(withHotkeys){
 const common=asset(config.mainAsset);
 assert(!common.text.includes('__wtHotkeys'));
 common.patched=common.text+'\n'+fs.readFileSync(path.join(__dirname,'hotkeys-core.js'),'utf8');
 if(withInventoryShare)common.patched+='\n'+fs.readFileSync(path.join(__dirname,'inventory-share.js'),'utf8');
 if(withKeyboard)common.patched+='\n'+fs.readFileSync(path.join(__dirname,'input-recorder.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'keyboard-ui.js'),'utf8');
 common.patched=replaceOnce(common.patched,'hidePet:e("native_menu_hide_pet")','hidePet:e("native_menu_hide_pet").replace(/F9/g,__wtHotkeys.read().visibility||"未设置")');
 common.patched=replaceOnce(common.patched,'showPet:e("native_menu_show_pet")','showPet:e("native_menu_show_pet").replace(/F9/g,__wtHotkeys.read().visibility||"未设置")');
 const monitor=asset(config.monitorAsset);
 monitor.patched=replaceOnce(monitor.text,'function Dt(t){return Mt.has(t)}','function Dt(t){return false}');
 resources.push(common,monitor);
}
if(withScreenshotFix){
 const bridge=asset(config.bridgeAsset);
 bridge.patched=replaceOnce(bridge.text,"async function Wt(e){await _(\"open_panel_window\",{payload:{tab:e??null}})}",fs.readFileSync(path.join(__dirname,'panel-open-guard.js'),'utf8').trim());
 if(withInventoryShare){
  bridge.patched=replaceOnce(bridge.patched,"async function qt(){await _(\"raise_panel_window_above_pets\")}",'async function qt(){}');
  bridge.patched=replaceOnce(bridge.patched,'await _("open_panel_window",{payload:{tab:e??null}});','await _("open_panel_window",{payload:{tab:e??null}});await p("wt-panel-normalize");');
 }
 resources.push(bridge);
}
let patched=Buffer.from(source);const changes=[];
for(const resource of resources){
 const bytes=Buffer.from(resource.patched);
 const compressed=zlib.brotliCompressSync(bytes,{params:{
  [zlib.constants.BROTLI_PARAM_MODE]:zlib.constants.BROTLI_MODE_TEXT,
  [zlib.constants.BROTLI_PARAM_QUALITY]:11,
  [zlib.constants.BROTLI_PARAM_LGWIN]:22,
  [zlib.constants.BROTLI_PARAM_SIZE_HINT]:bytes.length
 }});
 assert(compressed.length<=resource.meta.compressedBytes,`Replacement does not fit ${resource.meta.name}`);
 const start=resource.meta.offset,end=start+resource.meta.compressedBytes;
 patched.fill(0,start,end);compressed.copy(patched,start);
 assert(zlib.brotliDecompressSync(patched.subarray(start,end)).equals(bytes));
 const jsPath=path.join(outputDir,path.basename(resource.meta.name).replace(/\.js$/,'.patched.mjs'));
 fs.writeFileSync(jsPath,bytes);cp.execFileSync(process.execPath,['--check',jsPath],{stdio:'pipe'});
 changes.push({asset:resource.meta.name,offset:start,oldCompressedBytes:resource.meta.compressedBytes,
  newCompressedBytes:compressed.length,paddedBytes:resource.meta.compressedBytes-compressed.length,
  expandedBytes:bytes.length,jsPath});
}
const nativeResult=withKeyboard?require('./native-mouse-release.cjs').apply(source,patched):null;
const nativeChanges=nativeResult?.changes??[];if(nativeResult)patched=nativeResult.output;
let cursor=0;
const changedRanges=[...changes,...nativeChanges.map(change=>({...change,oldCompressedBytes:change.after.length/2}))];
for(const change of changedRanges.sort((a,b)=>a.offset-b.offset)){
 assert(source.subarray(cursor,change.offset).equals(patched.subarray(cursor,change.offset)));
 cursor=change.offset+change.oldCompressedBytes;
}
assert(source.subarray(cursor).equals(patched.subarray(cursor,source.length)));
assert.equal(hash(fs.readFileSync(config.sourcePath)),config.sourceSha256);
const outputPath=path.join(outputDir,withHelperRelease?'Wuwatappo_Helper.exe':withInventoryShare?'WuwaTappo-inventory-share.exe':withScreenshotFix?'WuwaTappo-screenshot-fix.exe':withHotkeys?'WuwaTappo-hotkeys.exe':withRoomVisibility?'WuwaTappo-enhanced.exe':'WuwaTappo-auto-chest.exe');
fs.writeFileSync(outputPath,patched);assert(fs.readFileSync(outputPath).equals(patched));
const report={version:config.version,sourcePath:config.sourcePath,sourceSha256:config.sourceSha256,
 outputPath,outputSha256:hash(patched),exeBytes:patched.length,
 features:['Existing +10000 button retained','Optional automatic left and right chest claims','Existing cooldown and balance checks','No simultaneous automatic claims','30-second retry delay','Default off; setting persists'],
 changes,nativeChanges,testsPassed:true,sourceUnchanged:true,runtimeTested:false,serverClaimTested:false};
if(withRoomVisibility)report.features.push('Room tab: hide all peer pets locally','Room tab: show all eligible peer pets locally');
report.features.push('Automatic claims wait at least 5 seconds after countdown readiness');
if(withHotkeys)report.features.push('Configurable F5/F7/F8/F9 actions with modifier combinations','Persistent key bindings and reset defaults','Duplicate and reserved-key conflict feedback','Centered room visibility button labels');
if(withScreenshotFix)report.features.push('Panel stays open on outside clicks via native skip guard','PrtScr passes through shortcut recording and action dispatch','Finished recorder does not consume unrelated keys');
if(withInventoryShare)report.features.push('Panel requests normal non-topmost window behavior and taskbar presence on open','Automatic raise-above-pets bridge disabled','Full owned inventory PNG export: characters / accessories / emotes, five columns','Original panel background and inventory quantity badges','Original four rarity PNG backgrounds','Rarity descending then series and role name in Chinese pinyin order','PNG preview with save and copy; oversized inventories split at canvas limit','Failed image loads visibly marked');
if(withKeyboard)report.features.push('Chibi 26-letter keyboard attached in front of the pet','Wuwa-only 1/2/3, Q/E/R, Space and two mouse buttons with live key highlights','Explicit start/stop recording limited to nine game controls','Readable UTF-8 TXT export with Chinese labels, press/release, relative times and hold durations','Configurable independent Ctrl+Alt+F10 recording shortcut','Recording stays in memory and is never uploaded automatically');
fs.writeFileSync(path.join(outputDir,'patch-manifest.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
