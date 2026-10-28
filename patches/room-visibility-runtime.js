function __wtSetAllRoomMembersVisible(visible){
  if(typeof visible!=="boolean"||Ie())return;
  __wtHideRoomPeers.value=!visible;
  __wtShownRoomPeers.value=new Set;
  if(visible){Md()}
  else{
    const hidden=new Set(Eo.value);
    for(const member of fe.value){
      if(!Number.isFinite(member.id)||member.id<=0||!member.online||!member.dockVisible||Go(member))continue;
      hidden.add(member.id);
    }
    Eo.value=hidden;
  }
  xo();
  tn();
  tt();
}
