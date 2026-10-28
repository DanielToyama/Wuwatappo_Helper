const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const root=path.resolve(__dirname,'..'),patches=path.join(root,'patches');
const config=JSON.parse(fs.readFileSync(path.join(patches,'patch-config.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(patches,'helper-release/patch-manifest.json'),'utf8'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const readAsset=name=>fs.readFileSync(path.join(patches,'assets',path.basename(name)),'utf8');
const baseline=JSON.parse(fs.readFileSync(path.join(patches,'api-compatibility-baseline.json'),'utf8'));
const common=readAsset(config.mainAsset),apiPaths=[...new Set([...common.matchAll(/["']\/?api\/[^"']+["']/g)].map(m=>m[0].slice(1,-1)))].sort();
assert.deepEqual(apiPaths,baseline.apiPaths,'API paths changed: review before adapting');
const declarations=babelParse(common,'common.mjs',true).program.body.filter(n=>n.type==='FunctionDeclaration');
for(const[name,digest]of Object.entries(baseline.requestFunctions)){
 const node=declarations.find(n=>n.id.name===name);assert(node,`Missing baseline function ${name}`);assert.equal(hash(common.slice(node.start,node.end)),digest,`Changed API/asset/click function ${name}`);
}
function globals(code){const found=new Set();traverse(babelParse(code,'resource.mjs',true),{ReferencedIdentifier(p){if(!p.scope.getBinding(p.node.name))found.add(p.node.name)}});return found}
const browserGlobals=new Set(['Infinity','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','getComputedStyle','ClipboardItem','performance','setInterval','clearInterval']);
for(const change of manifest.changes){
 const before=globals(readAsset(change.asset)),after=globals(fs.readFileSync(change.jsPath,'utf8'));
 assert.deepEqual([...after].filter(name=>!before.has(name)&&!browserGlobals.has(name)),[],`Unbound migration symbols in ${change.asset}`);
}
const settingsChange=manifest.changes.find(c=>c.asset===config.settingsAsset);
const shareBinding=require('./test-inventory-share-binding.cjs').verify(settingsChange.jsPath);
console.log(JSON.stringify(shareBinding));
const {spec,apply}=require('../patches/native-mouse-release.cjs');
const source=fs.readFileSync(manifest.sourcePath),output=fs.readFileSync(manifest.outputPath),plan=apply(source,Buffer.from(source));
for(const change of plan.changes)assert.equal(output.subarray(change.offset,change.offset+change.after.length/2).toString('hex'),change.after);
assert.equal(spec.channel,'wt-raw-mouse');
const tampered=Buffer.from(source);tampered[spec.functionOffset]^=1;assert.throws(()=>apply(tampered,Buffer.from(tampered)),/Unreviewed/);
const result={passed:true,sourceVersion:config.version,helperVersion:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).releaseVersion,apiPathsCompared:apiPaths.length,unchangedRelevantFunctions:Object.keys(baseline.requestFunctions).length,migratedResourcesChecked:manifest.changes.length,nativeReleasePatch:{sectionRva:plan.sectionRva,codeBytes:plan.codeBytes,changedRanges:plan.changes.length},nonRightMouseRoutingUnchanged:true,unboundMigrationSymbols:[],serverRequestsMade:false,serverAcceptanceVerified:false,nativeGameInputTested:false};
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/migration-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
