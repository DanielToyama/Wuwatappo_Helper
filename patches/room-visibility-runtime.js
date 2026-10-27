function __wtSetAllRoomMembersVisible(visible){
  if(typeof visible!=="boolean"||Me())return;
  if(visible){fd()}
  else{
    const hidden=new Set(So.value);
    for(const member of fe.value){
      if(!Number.isFinite(member.id)||member.id<=0||!member.online||!member.dockVisible||No(member))continue;
      hidden.add(member.id);
    }
    So.value=hidden;
  }
  Ao();
  en();
  tt();
}
