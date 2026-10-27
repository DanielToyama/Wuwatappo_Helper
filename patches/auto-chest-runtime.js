const __wtAutoChestKey="wuwatappo-auto-claim-chests-v1";
let __wtAutoChestBusy=false;
let __wtAutoChestLastSide="right";
const __wtAutoChestRetry={left:0,right:0};
const __wtAutoChestDueSince={left:null,right:null};
function __wtAutoChestEnabled(){
  try{return localStorage.getItem(__wtAutoChestKey)==="1"}catch{return false}
}
function __wtSetAutoChest(enabled){
  try{
    localStorage.setItem(__wtAutoChestKey,enabled?"1":"0");
    __wtAutoChestRetry.left=0;
    __wtAutoChestRetry.right=0;
    __wtAutoChestDueSince.left=null;
    __wtAutoChestDueSince.right=null;
  }catch(error){console.warn("[auto-chest] setting save failed",error)}
}
async function __wtAutoChestTick(){
  if(!__wtAutoChestEnabled()||!R.isLoggedIn||Me()||nt.value.status!=="online"){
    __wtAutoChestDueSince.left=null;__wtAutoChestDueSince.right=null;return;
  }
  const now=Date.now();
  for(const side of ["left","right"]){
    if(!(side==="left"?qn.value:Un.value))__wtAutoChestDueSince[side]=null;
    else if(__wtAutoChestDueSince[side]===null)__wtAutoChestDueSince[side]=now;
  }
  if(__wtAutoChestBusy||Co.value||R.totalClickCount<As)return;
  const sides=__wtAutoChestLastSide==="left"?["right","left"]:["left","right"];
  const side=sides.find(value=>(value==="left"?qn.value:Un.value)&&__wtAutoChestDueSince[value]!==null&&now-__wtAutoChestDueSince[value]>=2000&&now>=__wtAutoChestRetry[value]);
  if(!side)return;
  __wtAutoChestBusy=true;
  __wtAutoChestLastSide=side;
  __wtAutoChestRetry[side]=now+30000;
  try{
    await zl(side);
    const stillDue=side==="left"?qn.value:Un.value;
    __wtAutoChestRetry[side]=Date.now()+(stillDue?30000:1000);
  }catch(error){
    __wtAutoChestRetry[side]=Date.now()+30000;
    console.warn("[auto-chest] claim failed",error);
  }finally{__wtAutoChestBusy=false}
}
