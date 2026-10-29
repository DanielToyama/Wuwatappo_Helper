const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.WUWA_TEST_DISTRIBUTION_DIR||path.join(root,'dist/counter-hotfix-1.0.2.10'));
const source=fs.readFileSync(path.join(root,'patches/helper-release/index-DH_DNc-i.patched.mjs'),'utf8');
let handler,button;traverse(babelParse(source,'settings.mjs',true),{FunctionDeclaration(p){if(p.node.id.name==='As')handler=source.slice(p.node.start,p.node.end)},CallExpression(p){const a=p.node.arguments;if(a[0]?.value==='button'&&a[1]?.properties?.some(v=>v.key?.name==='class'&&v.value?.value==='setting-btn btn-boost-clicks'))button=source.slice(p.node.start,p.node.end)}});
assert(handler&&button,'Missing production handler/button');
async function main(){const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
 const page=await browser.newPage({viewport:{width:420,height:170},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const css=fs.readFileSync(path.join(root,'patches/assets/index-3cNSfJc6.css'),'utf8');
 await page.route('http://tauri.localhost/',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>'+css+'</style><style>body{margin:0;background:#fff8e9!important;font-family:"Microsoft YaHei",sans-serif}#card{padding:24px;display:block}.setting-content{display:flex;align-items:center;gap:16px}button:disabled{opacity:.55;cursor:wait}.count{font-variant-numeric:tabular-nums}</style></head><body><div id="card" class="setting-item"><div class="setting-title">本地点击数</div><div class="setting-content"><div id="button"></div><span class="count" id="count">0</span></div></div></body></html>'}));
 await page.goto('http://tauri.localhost/');
 await page.addScriptTag({content:'const __wtBoostUi={get value(){return this.busy||false},set value(v){this.busy=v;queueMicrotask(draw)}};const cl=10000,o=[],L=String;let sends=0,count=0;async function de(){sends++;count+=10000;document.querySelector("#count").textContent=count}const U=(fn,mods)=>e=>{if(mods.includes("stop"))e.stopPropagation();return fn(e)};function m(tag,props,label){const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k.startsWith("on"))n.addEventListener(k.slice(2).toLowerCase(),v);else if(k==="disabled")n.disabled=v;else n.setAttribute(k,v)}n.textContent=label;return n}'+handler+';function draw(){document.querySelector("#button").replaceChildren('+button+')}draw();window.stats=()=>({sends,count,busy:__wtBoostUi.value});'});
 const box=await page.locator('.btn-boost-clicks').boundingBox();assert(box&&box.width>80&&box.x>=0&&box.x+box.width<=420);
 await page.evaluate(()=>document.querySelector('.btn-boost-clicks').click());await page.waitForTimeout(60);assert.equal(await page.locator('.btn-boost-clicks').isDisabled(),true);
 fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'counter-button-cooldown.png')});
 await page.evaluate(()=>new Promise(resolve=>{let i=0;const timer=setInterval(()=>{document.querySelector('.btn-boost-clicks').click();if(++i>=120){clearInterval(timer);resolve()}},10)}));
 const stats=await page.evaluate(()=>window.stats());assert(stats.sends>=2&&stats.sends<=4);assert.equal(stats.count,stats.sends*10000);
 await page.waitForTimeout(600);assert.equal(await page.locator('.btn-boost-clicks').isDisabled(),false);
 await page.screenshot({path:path.join(out,'counter-button-ready.png')});assert.deepEqual(errors,[]);
 const result={passed:true,productionHandlerAndButton:true,originalStyles:true,syntheticClicks:121,acceptedBoosts:stats.sends,visibleCooldown:true,cooldownRecovers:true,realMouseOrAccountTested:false};fs.writeFileSync(path.join(out,'counter-ui-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close()}}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
