async function __wtOpenRoomHistory(){
 try{const module=await import('http://127.0.0.1:48642/ui.js');await module.openRoomHistory({state:()=>({accountId:oe.isLoggedIn?oe.userInfo?.id:0,roomId:String(y.currentRoomId??'').trim(),mode:y.roomMode}),send:de,listen:Dn,toast:He})}
 catch{He('历史房间加载失败，请运行最新版完整 EXE')}
}
function __wtHistoryButton(){return e('button',{type:'button',class:'wt-room-history-button',style:{position:'static',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,height:'30px',padding:'0 10px',margin:'0 0 0 8px',border:'1px solid #d8b58a',borderRadius:'15px',background:'#fff3dd',color:'#8e5e43',font:'14px "Microsoft YaHei",sans-serif',lineHeight:1,whiteSpace:'nowrap'},onMousedown:U(()=>{},['stop']),onClick:U(__wtOpenRoomHistory,['stop'])},'历史房间')}
