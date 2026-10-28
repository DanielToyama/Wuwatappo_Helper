const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
function initializer(file){const source=fs.readFileSync(file,'utf8');let result;traverse(babelParse(source,'settings.mjs',true),{VariableDeclarator(p){if(p.node.id?.name==='__wtShare'){assert(!result,'Ambiguous inventory share binding');result=source.slice(p.node.init.start,p.node.init.end)}}});assert(result,'Missing production share initializer');return result}
function verify(file){const code=initializer(file),props={bagList:[{asset_id:1}],assetsCdnHost:'test.invalid',bagListLoading:false},auth={isLoggedIn:true,userInfo:{id:41}};
 const get=vm.runInNewContext(code,{y:props,oe:auth,I:v=>({value:v}),He:()=>{},__wtInventoryShare:{create:(ref,get)=>get}});
 assert(!Object.hasOwn(props,'userInfo'),'Fixture must match original BagTab props without userInfo');
 assert.equal(get().user?.id,41,'Share account must come from the login store; BagTab has no userInfo prop');
 assert.equal(get().items,props.bagList);assert.equal(get().loggedIn,true);
 props.userInfo={id:999};assert.equal(get().user.id,41,'Never use an unrelated prop as the account');
 auth.userInfo={id:42};assert.equal(get().user.id,42,'Getter must follow account switches');
 auth.isLoggedIn=false;auth.userInfo=null;assert.equal(get().loggedIn,false);assert.equal(get().user,null);
 return {passed:true,productionShareInitializer:true,bagPropsDoNotSupplyUserInfo:true,accountFromLoginStore:true,accountSwitchAndLogoutFollowStore:true};}
module.exports={initializer,verify};
if(require.main===module){const file=process.argv[2]||path.join(__dirname,'../patches/helper-release/index-DH_DNc-i.patched.mjs');console.log(JSON.stringify(verify(file),null,2))}
