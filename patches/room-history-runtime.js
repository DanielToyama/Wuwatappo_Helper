async function __wtEnterHistoryRoom(event){
 const requestId=typeof event.requestId==='string'?event.requestId.slice(0,80):'';
 if(!requestId)return;
 const send=(code,message)=>__wtRoomEmit('wt-room-history-result',{requestId,accountId:event.accountId,code,message}).catch(()=>{});
 const result=await __wtRoomHistory.enter(event.accountId,event.roomId,{
  state:()=>({accountId:A.isLoggedIn?__wtRoomHistoryCore.account(A.userInfo?.id):0,roomId:String(Vo.value??'').trim(),mode:Uo.value,canLeave:Oa.value,canJoin:xa.value,blocked:Ie()}),
  leave:async()=>{Rm(String(Vo.value??''));const ok=await Zp();if(ok)hc();gc();return ok},
  join:async()=>{Am();await Qp()},setInput:id=>{Jr.value=id;tt()},notify:message=>send('pending',message)
 });
 send(result.code,result.message);tt();
}
