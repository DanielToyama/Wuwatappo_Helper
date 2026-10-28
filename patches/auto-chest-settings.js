const __wtAutoChestUi=I((()=>{try{return localStorage.getItem("wuwatappo-auto-claim-chests-v1")==="1"}catch{return false}})());
async function __wtToggleAutoChest(){
  const enabled=!__wtAutoChestUi.value;
  try{await de({type:"set-auto-claim-chests",enabled});__wtAutoChestUi.value=enabled}
  catch(error){console.warn("[auto-chest] toggle failed",error);He("设置自动领取失败，请重试")}
}
