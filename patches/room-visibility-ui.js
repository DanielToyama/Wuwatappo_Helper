async function __wtBulkRoomVisible(visible){
  try{await de({type:"set-room-members-visibility",visible})}
  catch(error){console.warn("[room-visibility] bulk change failed",error);He("批量设置可见性失败，请重试")}
}
