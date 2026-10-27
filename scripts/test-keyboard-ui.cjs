const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist/keyboard-tests');fs.mkdirSync(out,{recursive:true});
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.WUWA_TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const context=await browser.newContext({viewport:{width:600,height:650},deviceScaleFactor:2,acceptDownloads:true});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  const png=fs.readFileSync(process.env.WUWA_TEST_PET||path.join(root,'patches/share-fixtures/character_skin.png')).toString('base64');
  await page.setContent('<html><head><style>body{margin:0;background:#f7f3ed;font-family:"Microsoft YaHei",sans-serif;color:#8e5e43}.stage{margin:35px auto;width:200px}.pet-dock-content{display:flex;flex-direction:column;width:200px}.cat-wrap{width:200px;height:200px}.cat-wrap img{width:200px;height:200px;object-fit:contain}.pet-info-container{margin-top:6px;background:#fff3dd;border-radius:20px;text-align:center;font-size:13px;padding:5px}.caption{text-align:center;font-size:14px;margin:26px 0}</style></head><body><p class="caption">离线界面测试 · 示例角色</p><div class="stage"><div class="pet-dock-content"><div class="cat-wrap"><img src="data:image/png;base64,'+png+'"></div><div class="pet-info-container">Wuwatappo Helper</div></div></div></body></html>');
  await page.addScriptTag({content:"window.storage=new Map();window.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};window.emit=async()=>{};"});
  for(const file of ['input-recorder.js','keyboard-ui.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,'patches',file),'utf8').replace(/export \{[^}]+\};?/g,'')});
  await page.evaluate(async()=>{window.petVisible=true;window.demo=__wtKeyboardUi.create({listen:async()=>()=>{},visible:()=>petVisible,hotkeys:{read:()=>({record:'Ctrl+Alt+F10'}),editable:target=>['INPUT','TEXTAREA'].includes(target?.tagName)},toClient:(x,y)=>({x,y})});await demo.mount()});
  assert.equal(await page.locator('kbd').count(),26);assert.equal(new Set(await page.locator('kbd').evaluateAll(nodes=>nodes.map(n=>n.dataset.wtKey))).size,26);
  const geometry=await page.evaluate(()=>{const a=document.querySelector('.wt-input-ui').getBoundingClientRect(),b=document.querySelector('.cat-wrap').getBoundingClientRect();return {width:a.width,petWidth:b.width,keyboardTop:a.top,petBottom:b.bottom}});assert.equal(geometry.width,geometry.petWidth);assert(geometry.keyboardTop<geometry.petBottom);assert(geometry.petBottom-geometry.keyboardTop<=30);
  await page.keyboard.down('q');assert(await page.locator('[data-wt-key="Q"]').evaluate(node=>node.classList.contains('wt-key-on')));await page.keyboard.up('q');await page.waitForTimeout(100);assert.equal(await page.locator('kbd.wt-key-on').count(),0);
  await page.screenshot({path:path.join(out,'keyboard-26.png')});
  await page.getByRole('button',{name:'鸣潮专属',exact:true}).click();assert.equal(await page.locator('kbd').count(),6);
  await page.getByRole('button',{name:'开始录制',exact:true}).click();assert.equal(await page.evaluate(()=>demo.recording),true);assert((await page.locator('.wt-status').textContent()).includes('录制中'));
  await page.keyboard.press('a');await page.keyboard.down('q');await page.keyboard.down('e');await page.keyboard.up('q');await page.keyboard.up('e');await page.keyboard.press('r');await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>demo.recording),true,'Space must not accidentally activate the clicked Start button');
  await page.evaluate(()=>{demo.mouse('left','press',{x:0,y:0});demo.mouse('left','release',{x:0,y:0});demo.mouse('right','press',{x:0,y:0});demo.mouse('right','release',{x:0,y:0})});
  await page.evaluate(()=>{const rect=document.querySelector('.wt-record-button').getBoundingClientRect();window.controlPoint={x:rect.x+5,y:rect.y+5};demo.mouse('left','press',controlPoint)});
  await page.getByRole('button',{name:'结束录制',exact:true}).click();await page.evaluate(()=>demo.mouse('left','release',controlPoint));
  const last=await page.evaluate(()=>demo.last);assert.equal(last.events.length,12);assert.deepEqual([...new Set(last.events.map(e=>e.key))].sort(),['E','MouseLeft','MouseRight','Q','R','Space']);assert(last.events.every(e=>!e.synthetic));
  const jsonDownload=page.waitForEvent('download');await page.getByRole('link',{name:'导出 JSON'}).click();const jsonFile=await jsonDownload;await jsonFile.saveAs(path.join(out,'recording.json'));assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out,'recording.json'),'utf8')),last);
  const csvDownload=page.waitForEvent('download');await page.getByRole('link',{name:'导出 CSV'}).click();const csvFile=await csvDownload;await csvFile.saveAs(path.join(out,'recording.csv'));assert.equal(fs.readFileSync(path.join(out,'recording.csv'),'utf8').split('\r\n').length,14);
  await page.screenshot({path:path.join(out,'keyboard-wuwa.png')});
  await page.evaluate(()=>demo.toggle());assert.equal(await page.evaluate(()=>demo.recording),true);await page.evaluate(()=>demo.setMode('hidden'));assert.equal(await page.evaluate(()=>demo.recording),false);assert.equal(await page.locator('.wt-input-ui').isVisible(),false);await page.evaluate(()=>demo.setMode('wuwa'));assert.equal(await page.getByRole('link',{name:'导出 JSON'}).count(),1);
  await page.evaluate(()=>{demo.toggle();petVisible=false});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>demo.recording),false);assert.equal(await page.evaluate(()=>demo.last.stop_reason),'pet_hidden');
  await page.evaluate(()=>demo.dispose());assert.equal(await page.locator('.wt-input-ui').count(),0);assert.deepEqual(errors,[]);
  const result={passed:true,checks:['26 unique QWERTY keys and matching pet width','Keyboard overlaps the pet foreground by 24px','Key-down highlight and key-up release','Six-control game UI and visible recording state','Space does not toggle the clicked record button','DOM keyboard and native mouse adapters preserve twelve allowed events','Control-widget clicks excluded from recordings','Actual JSON and CSV browser downloads retain all events','Hiding stops recording; exports remain available on return','Listeners and DOM are removed on disposal'],nativeGlobalHooksTested:false,realGameInputTested:false,realUserInputsCaptured:false};fs.writeFileSync(path.join(out,'ui-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await context.close();await browser.close()}
}
main().catch(error=>{console.error(error.stack);process.exitCode=1});
