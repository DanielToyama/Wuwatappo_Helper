const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'inventory-luck.js'),'utf8').replace('export const InventoryLuck=','this.Luck='),context);const L=context.Luck,plain=x=>JSON.parse(JSON.stringify(x));
const groups=counts=>[{items:counts.map((quantity,i)=>({quantity,rarity:L.rarities[i]}))}];
async function main(){
 assert.equal(L.probabilities.reduce((s,v)=>s+v,0),1);assert.equal(L.colors.length,4);assert.equal(new Set(L.colors).size,4);
 const baseline=L.assess(L.composition(groups([9000,950,49,1])));assert.equal(baseline.grade,2);assert(Math.abs(baseline.index)<1e-12);assert.equal(baseline.total,10000);assert.deepEqual(plain(baseline.counts),[9000,950,49,1]);
 assert.equal(L.assess(L.composition(groups([100,0,0,0]))).grade,0);assert.equal(L.assess(L.composition(groups([90,9,0,1]))).grade,4);
 assert.equal(L.assess(L.composition(groups([0,0,0,0]))).grade,null);assert.equal(L.assess(L.composition([{items:[{quantity:1,rarity:'unknown'}]}])).grade,null);
 assert.throws(()=>L.composition(groups([Infinity,0,0,0])));assert.throws(()=>L.composition(groups([Number.MAX_SAFE_INTEGER,1,0,0])));
 assert.equal(L.synthesis({synthesis_count:0}).available,true);assert.equal(L.synthesis({synthesis_count:0}).total,0);assert.equal(L.synthesis({}).available,false);assert.equal(L.synthesis({synthesis_count:-1}).available,false);assert.equal(L.synthesis({synthesis_count:'99'}).available,false);assert.equal(L.synthesis({synthesis_count:1,total_synthesis_count:2}).available,false);
 assert.equal(L.synthesis({same_level_synthesis_count:2,upgrade_synthesis_count:3}).total,5);assert.equal(L.synthesis({same_level_synthesis_count:2}).available,false);
 const user={id:1};let requests=0;const data=await L.prepare(groups([90,9,0,1]),user,async()=>{requests++;return {id:1,synthesis_count:8}},()=>user);assert.equal(requests,1);assert.equal(data.synthesis.total,8);
 const expectedTitles=['雪豹卡卡罗の挚友','维神和羊咩的老熟人','索拉里普通漂泊者','小保底の常胜将军','库洛亲选天命之子'];assert.deepEqual(plain(L.titles),expectedTitles);
 const cases=[[100,0,0,0],[94,6,0,0],[90,10,0,0],[84,16,0,0],[90,9,0,1]];
 for(let grade=0;grade<5;grade++){const sample=await L.prepare(groups(cases[grade]),user,async()=>({id:1}),()=>user);assert.equal(sample.grade,grade);assert.equal(sample.title,expectedTitles[grade]);assert.equal(sample.comment,L.comments[grade]);}
 assert.equal(L.comments[1],'怎么说呢，也不是不能用……先凑合着吧。');assert(L.comments[0].includes('7命'));assert.equal(L.headerHeight,350);
 const missing=await L.prepare(groups([90,9,0,1]),user,async()=>({id:1}),()=>user);assert.equal(missing.synthesis.total,null);assert.equal(missing.grade,4);
 const failed=await L.prepare(groups([90,9,0,1]),user,async()=>{throw Error('offline')},()=>user);assert.equal(failed.synthesis.available,false);
 await assert.rejects(L.prepare(groups([1,0,0,0]),user,async()=>({id:2,synthesis_count:100}),()=>user),/账号/);await assert.rejects(L.prepare(groups([1,0,0,0]),user,async()=>({id:1}),()=>({id:2})),/账号/);
 const report={passed:true,checks:['Confirmed four probabilities sum to one','Composition counts pieces including duplicates','Baseline composition grades neutral; five-grade index is an entertainment heuristic','Empty or unknown-rarity stock is not graded','Separate missing synthesis data from an actual zero','Reject conflicting, invalid or partial synthesis counters','Account read once; failures do not fabricate counts','Account changes discard the whole snapshot'],realAccountSynthesisFieldsVerified:false,realServerRequestsMade:false};fs.writeFileSync(path.join(__dirname,'inventory-luck-tests.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}main().catch(e=>{console.error(e.stack);process.exitCode=1});
