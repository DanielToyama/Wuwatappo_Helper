const __wtKeyboardUi=(()=>{
 const storageKey='wuwatappo-keyboard-ui-v1',modes=['hidden','letters','wuwa'];
 const css=`
.wt-input-ui{position:relative;z-index:15;width:200px;box-sizing:border-box;margin:-24px 0 5px;color:#8e5e43;font:11px "Microsoft YaHei",sans-serif;pointer-events:auto;user-select:none;touch-action:none}
.wt-input-ui *{box-sizing:border-box}.wt-input-toolbar{display:flex;align-items:center;gap:4px;padding:0 7px 4px}.wt-input-ui button,.wt-input-ui a{position:static;font:inherit;color:#8e5e43;line-height:1.3;text-align:center;text-decoration:none;cursor:pointer;border:1px solid #e7b77c;border-radius:10px;background:#fff3dd;padding:3px 7px;min-width:0;height:auto;filter:none;white-space:nowrap}.wt-input-ui button:disabled{opacity:.55;cursor:default}.wt-input-ui button[aria-pressed=true]{background:#fed291}.wt-input-ui .wt-close{margin-left:auto;padding:1px 6px}.wt-keyboard-plate{position:relative;border:2px solid #b88764;border-bottom-width:5px;border-radius:18px 19px 21px 15px;padding:8px 7px 6px;background:linear-gradient(160deg,#fff8e9,#ffdcaa);box-shadow:0 3px 0 #ead3b7,0 5px 7px #8e5e4320;transform:perspective(480px) rotateX(12deg);transform-origin:50% 100%}.wt-keyboard-plate:before{content:'';position:absolute;width:14px;height:5px;left:15px;top:-5px;border-radius:4px;background:#e7b77c;border:1px solid #b88764}.wt-keyboard-plate:after{content:'';position:absolute;width:8px;height:8px;right:9px;bottom:7px;border-radius:50%;background:#c8dcc4;border:1px solid #9eb397}.wt-key-row{display:flex;justify-content:center;gap:3px;margin:3px 0}.wt-input-ui kbd{display:flex;align-items:center;justify-content:center;position:relative;flex:none;width:15px;height:19px;border:1px solid #be9879;border-bottom-width:3px;border-radius:5px 5px 6px 5px;background:#fffaf0;color:#8e5e43;font:bold 9px "Microsoft YaHei",sans-serif;box-shadow:0 1px 0 #f0cca3;transition:background .06s,transform .06s,box-shadow .06s}.wt-input-ui kbd.wt-key-on{background:#ffc977;color:#6e452d;border-color:#ba8050;transform:translateY(2px);box-shadow:0 0 5px #ffe391,0 0 0 1px #ffe391}.wt-qer-board{display:flex;gap:8px;align-items:center;padding:4px 3px}.wt-qer-left{width:111px}.wt-qer-row{display:flex;gap:5px}.wt-qer-board kbd{width:33px;height:30px;border-radius:8px;font-size:14px}.wt-qer-board kbd.wt-space{width:109px;height:23px;margin-top:5px;font-size:10px}.wt-mouse{display:flex;width:52px;height:59px;border:2px solid #b88764;border-bottom-width:4px;border-radius:20px 20px 16px 16px;background:#f4e1c8;overflow:hidden}.wt-mouse kbd{width:24px;height:54px;border:0;border-radius:16px 0 0 12px;font-size:9px;box-shadow:none;writing-mode:vertical-rl}.wt-mouse kbd+ kbd{border-left:1px solid #be9879;border-radius:0 16px 12px 0}.wt-record-controls{display:flex;gap:4px;align-items:center;margin-top:8px}.wt-record-controls button{flex:1;background:#fed291}.wt-input-ui .wt-record-button{background:#fff0e8;border-color:#d39d87}.wt-is-recording .wt-record-button{background:#ffd4cc;border-color:#c87664}.wt-status{font-size:10px;line-height:1.45;min-height:15px;padding:5px 6px 0;overflow-wrap:anywhere}.wt-is-recording .wt-status:before{content:'● ';color:#c85545}.wt-export-controls{display:flex;gap:4px;flex-wrap:wrap;margin:5px 4px}.wt-export-controls a{background:#e6efda}.wt-input-ui .wt-event-count{font-variant-numeric:tabular-nums}.wt-letter-label{font-size:9px;text-align:center;color:#af8a6e;margin-top:3px;letter-spacing:2px}
`;
 function readMode(){try{const value=localStorage.getItem(storageKey);return modes.includes(value)?value:'letters'}catch{return 'letters'}}
 function saveMode(mode){if(!modes.includes(mode))return;try{localStorage.setItem(storageKey,mode)}catch{}return emit('wt-keyboard-config',{mode}).catch(()=>{})}
 function settings(ref,toast){const model={mode:ref(readMode())};model.set=mode=>{model.mode.value=mode;saveMode(mode);toast('键盘映射已切换')};return model}
 function renderSettings(h,model){
  return h('div',{style:{padding:'12px 0',borderTop:'1px solid #EFD4B7',marginTop:'14px'}},[
   h('div',{style:{fontSize:'18px',color:'#8e5e43',marginBottom:'8px'}},'桌面键盘映射'),
   h('div',{style:{display:'flex',gap:'8px'}},[['hidden','不显示'],['letters','26 字母键'],['wuwa','鸣潮专属']].map(([mode,label])=>h('button',{type:'button',style:{position:'static',padding:'5px 12px',border:'1px solid #E7B77C',borderRadius:'14px',color:'#8e5e43',background:model.mode.value===mode?'#fed291':'#fff3dd',font:'inherit'},onClick:()=>model.set(mode)},label,4))),
   h('div',{style:{fontSize:'12px',color:'#8e7b6a',marginTop:'8px',lineHeight:'1.5'}},'鸣潮专属只录 Q/E/R、空格、鼠标左右键；开始和结束录制使用下方独立快捷键。')
  ]);
 }
 function create(deps={}){
  const doc=deps.document??document,core=__wtInputRecorder.create(deps.recorderOptions);let mode=readMode(),root=null,status=null,recordButton=null,exportsBox=null,stopListen=null,ticker=null,disposed=false;
  const keys=new Map(),onAt=new Map(),timers=new Map(),urls=[];
  function allow(){return !deps.blocked?.()}
  function layout(){deps.layout?.()}
  function button(label,action,parent){const node=doc.createElement('button');node.type='button';node.textContent=label;node.onclick=action;parent.append(node);return node}
  function makeKey(key,label,parent){const node=doc.createElement('kbd');node.textContent=label??key;node.dataset.wtKey=key;node.setAttribute('aria-label',key);parent.append(node);keys.set(key,node);return node}
  function paint(key,down){
   const node=keys.get(key);if(!node)return;
   const old=timers.get(key);if(old){clearTimeout(old);timers.delete(key)}
   if(down){onAt.set(key,performance.now());node.classList.add('wt-key-on');return}
   const delay=Math.max(0,80-(performance.now()-(onAt.get(key)??0)));
   timers.set(key,setTimeout(()=>{node.classList.remove('wt-key-on');timers.delete(key);onAt.delete(key)},delay));
  }
  function refresh(){
   if(!root)return;
   if(core.active&&deps.visible&&!deps.visible()){finish('pet_hidden');return}
   root.classList.toggle('wt-is-recording',core.active);
   root.querySelectorAll('[data-mode]').forEach(node=>{node.disabled=core.active;node.setAttribute('aria-pressed',String(node.dataset.mode===mode))});
   if(recordButton)recordButton.textContent=core.active?'结束录制':'开始录制';
   const shortcut=deps.hotkeys?.read().record||'未设置快捷键';
   if(status)status.textContent=core.active?'录制中 '+(core.duration/1000).toFixed(1)+'s · '+core.count+' 条':core.last?(core.last.stop_reason==='event_limit'?'条目达上限，已结束 · ':'已结束 · ')+core.last.events.length+' 条，可导出':'未录制 · '+shortcut;
  }
  function revoke(){urls.splice(0).forEach(url=>URL.revokeObjectURL(url));if(exportsBox)exportsBox.replaceChildren()}
  function exportResult(result){
   revoke();if(!exportsBox||!result)return;
   const stamp=result.started_at.replace(/[:.]/g,'-');
   for(const[extension,type,content]of [['json','application/json',JSON.stringify(result,null,2)],['csv','text/csv;charset=utf-8',__wtInputRecorder.csv(result)]]){
    const url=URL.createObjectURL(new Blob([content],{type}));urls.push(url);const link=doc.createElement('a');link.href=url;link.download='Wuwa-操作录制-'+stamp+'.'+extension;link.textContent='导出 '+extension.toUpperCase();exportsBox.append(link);
   }
   refresh();if(result.stop_reason==='event_limit'&&status)status.textContent='条目已达上限，录制已结束，请导出';layout();
  }
  function finish(reason='user'){const result=core.stop(reason);exportResult(result);refresh();return result}
  function toggle(){
   if(disposed)return;
   if(core.active){finish();return}
   if(!allow())return;
   if(mode!=='wuwa')setMode('wuwa');
   revoke();core.start();refresh();layout();
  }
  function render(){
   if(!root)return;
   for(const timer of timers.values())clearTimeout(timer);timers.clear();keys.clear();onAt.clear();root.replaceChildren();recordButton=null;exportsBox=null;
   root.hidden=mode==='hidden';if(root.hidden){layout();return}
   const toolbar=doc.createElement('div');toolbar.className='wt-input-toolbar';root.append(toolbar);
   for(const[value,label]of [['letters','26键'],['wuwa','鸣潮专属']]){const item=button(label,()=>setMode(value),toolbar);item.dataset.mode=value}
   const close=button('×',()=>setMode('hidden'),toolbar);close.className='wt-close';close.title='隐藏键盘，可在设置中重新开启';
   const plate=doc.createElement('div');plate.className='wt-keyboard-plate';root.append(plate);
   if(mode==='letters'){
    for(const row of ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']){const container=doc.createElement('div');container.className='wt-key-row';plate.append(container);for(const key of row)makeKey(key,key,container)}
    const label=doc.createElement('div');label.className='wt-letter-label';label.textContent='TAP TAP';plate.append(label);
   }else{
    const board=doc.createElement('div');board.className='wt-qer-board';plate.append(board);const left=doc.createElement('div');left.className='wt-qer-left';board.append(left);const row=doc.createElement('div');row.className='wt-qer-row';left.append(row);for(const key of ['Q','E','R'])makeKey(key,key,row);makeKey('Space','空 格',left).classList.add('wt-space');
    const mouse=doc.createElement('div');mouse.className='wt-mouse';board.append(mouse);makeKey('MouseLeft','左键',mouse);makeKey('MouseRight','右键',mouse);
    const controls=doc.createElement('div');controls.className='wt-record-controls';root.append(controls);recordButton=button('开始录制',toggle,controls);recordButton.className='wt-record-button';recordButton.title='只录制 Q/E/R、空格与鼠标左右键';
    button('清除',()=>{if(core.active)finish('cleared');core.clear();revoke();for(const node of keys.values())node.classList.remove('wt-key-on');refresh();layout()},controls);
    exportsBox=doc.createElement('div');exportsBox.className='wt-export-controls';root.append(exportsBox);if(core.last)exportResult(core.last);
   }
   status=doc.createElement('div');status.className='wt-status wt-event-count';status.setAttribute('role','status');root.append(status);
   for(const key of core.held)keys.get(key)?.classList.add('wt-key-on');refresh();layout();
  }
  function setMode(value,external=false){
   if(!modes.includes(value)||disposed)return;
   if(core.active&&value!=='wuwa')finish('mode_changed');
   mode=value;if(!external)saveMode(value);render();
  }
  function key(raw,down,options={}){
   if(!root)return;
   if(core.active&&deps.visible&&!deps.visible())finish('pet_hidden');
   const normalized=__wtInputRecorder.normalize(raw),before=core.active;
   const changed=core.input(raw,down,{capture:allow()&&!options.control});
   if(changed)paint(normalized,down);if(before&&!core.active)exportResult(core.last);
  }
  function inside(point){
   if(!root||!point)return false;const local=deps.toClient?.(point.x,point.y);if(!local)return false;const rect=root.getBoundingClientRect();return local.x>=rect.left&&local.x<=rect.right&&local.y>=rect.top&&local.y<=rect.bottom;
  }
  function mouse(buttonName,action,point){key(buttonName==='left'?'MouseLeft':buttonName==='right'?'MouseRight':'',action==='press',{control:inside(point)})}
  function domKey(event){if(deps.hotkeys?.editable(event.target))return;key(event.code||event.key,event.type==='keydown',{control:deps.hotkeys?.fromEvent?.(event)==='record'})}
  async function mount(){
   if(root||disposed)return;
   const dock=doc.querySelector('.pet-dock-content');if(!dock)throw Error('Pet dock not mounted');
   if(!doc.getElementById('wt-input-style')){const style=doc.createElement('style');style.id='wt-input-style';style.textContent=css;doc.head.append(style)}
   root=doc.createElement('section');root.className='wt-input-ui';root.setAttribute('aria-label','桌面键盘映射');
   root.addEventListener('mousedown',event=>{event.stopPropagation();if(event.target.closest('button'))event.preventDefault()});root.addEventListener('click',event=>event.stopPropagation());root.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation()});
   dock.insertBefore(root,dock.querySelector('.pet-info-container'));render();
   doc.addEventListener('keydown',domKey,true);doc.addEventListener('keyup',domKey,true);
   if(deps.listen)stopListen=await deps.listen('wt-keyboard-config',event=>{if(event.payload?.mode!==mode)setMode(event.payload?.mode,true)});
   ticker=setInterval(refresh,200);
  }
  function dispose(){disposed=true;if(core.active)core.stop('app_closed');stopListen?.();clearInterval(ticker);doc.removeEventListener('keydown',domKey,true);doc.removeEventListener('keyup',domKey,true);for(const timer of timers.values())clearTimeout(timer);revoke();core.clear();root?.remove();root=null}
  return {mount,dispose,key,mouse,toggle,setMode,get recording(){return core.active},get last(){return core.last}};
 }
 return {create,settings,renderSettings,readMode,css};
})();
export {__wtKeyboardUi};
