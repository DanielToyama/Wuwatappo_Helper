// Inventory composition reference only; synthesis/redeems are not original draws.
export const InventoryLuck=(()=>{
 const rarities=['common','uncommon','rare','epic'],probabilities=[.9,.095,.0049,.0001],weights=[0,1,3,10];
 const colors=['#8bc5ab','#83add3','#b092ce','#e8bb67'];
 const titles=['雪豹卡卡罗の挚友','维神和羊咩的老熟人','索拉里普通漂泊者','小保底の常胜将军','库洛亲选天命之子'];
 const comments=['你一定有7命雪豹和卡卡罗吧，溢出的那一命都是感情。','怎么说呢，也不是不能用……先凑合着吧。','有时提前出货，有时保底吃满，主打一个漂泊者的正常生活。','别人祈祷这次别歪，你在考虑这次要不要补个二命。','别人抽卡消耗星声，你抽卡像在领取邮件附件。'];
 const headerHeight=350;
 function composition(groups){const counts=[0,0,0,0];let unknown=0;for(const g of groups)for(const item of g.items){const q=item.quantity,i=rarities.indexOf(String(item.rarity).toLowerCase());if(!Number.isSafeInteger(q)||q<0)throw Error('库存数量无效');if(i<0)unknown+=q;else counts[i]+=q}const total=counts.reduce((s,v)=>s+v,0);if(!Number.isSafeInteger(total+unknown))throw Error('库存数量超出统计范围');return {counts,total,unknown,ratios:counts.map(v=>total?v/total:0)}}
 function assess(data){if(!data.total||data.unknown)return {...data,grade:null,index:null};const mean=probabilities.reduce((s,p,i)=>s+p*weights[i],0),variance=probabilities.reduce((s,p,i)=>s+p*weights[i]**2,0)-mean**2;
  // Thirty baseline-equivalent items damp very small inventory samples.
  const score=data.counts.reduce((s,n,i)=>s+n*weights[i],0),index=(score-data.total*mean)/Math.sqrt(variance*(data.total+30));
  const grade=index< -1.5?0:index< -.5?1:index<=.5?2:index<=1.5?3:4;return {...data,index,grade};}
 function synthesis(user){const valid=n=>Number.isSafeInteger(n)&&n>=0,totals=['synthesis_count','total_synthesis_count','synthesis_times'].map(k=>user?.[k]).filter(valid),unique=[...new Set(totals)];
  if(unique.length===1)return {total:unique[0],available:true};if(unique.length>1)return {total:null,available:false};
  const same=user?.same_level_synthesis_count,upgrade=user?.upgrade_synthesis_count;
  return valid(same)&&valid(upgrade)&&valid(same+upgrade)?{total:same+upgrade,same,upgrade,available:true}:{total:null,available:false};}
 async function prepare(groups,user,readUser,currentUser){const account=user?.id;if(!Number.isSafeInteger(account)||account<=0)throw Error('账号状态无效，请重新读取库存');let fresh;
  try{fresh=await readUser()}catch{fresh=null}
  if(currentUser()?.id!==account)throw Error('账号已切换，请重新读取库存');
  if(fresh&&fresh.id!==account)throw Error('账号已切换，请重新读取库存');
  const data=assess(composition(groups));return {...data,synthesis:synthesis(fresh),title:data.grade===null?'数据不足':titles[data.grade],comment:data.grade===null?'库存数据不足，暂不判定等级。':comments[data.grade]};}
 const percent=p=>p>0&&p<.0001?'<0.01%':(p*100).toFixed(2)+'%';
 function lines(ctx,value,width){const result=[];let line='';for(const char of String(value)){if(line&&ctx.measureText(line+char).width>width){result.push(line);line=''}line+=char}if(line)result.push(line);return result;}
 function draw(ctx,data){
  ctx.fillStyle='#8e5e43';ctx.font='16px "Microsoft YaHei",sans-serif';ctx.fillText('经鉴定，你的运气等级为：',30,116);
  ctx.font='bold 32px "Microsoft YaHei",sans-serif';ctx.fillText(data.title,30,157);
  ctx.font='15px "Microsoft YaHei",sans-serif';lines(ctx,'评语：'+data.comment,550).forEach((line,i)=>ctx.fillText(line,30,188+i*22));
  ctx.font='16px "Microsoft YaHei",sans-serif';ctx.fillText('按件数统计（包含重复）：'+data.total+' 件',30,240);
  ctx.fillText('合成次数：'+(data.synthesis.available?data.synthesis.total+' 次（账号返回）':'未读取到，不能视为 0'),30,267);
  ctx.font='13px "Microsoft YaHei",sans-serif';ctx.fillText('基准概率：Common 90% · Uncommon 9.5%',30,293);ctx.fillText('Rare 0.49% · Epic 0.01%　仅供娱乐，不代表抽取记录',30,314);
  ctx.fillStyle='#fff9ed';ctx.strokeStyle='#dfc5a2';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(616,18,354,306,16);ctx.fill();ctx.stroke();
  ctx.fillStyle='#8e5e43';ctx.font='bold 17px "Microsoft YaHei",sans-serif';ctx.fillText('稀有度占比 · 当前库存',635,49);
  const cx=702,cy=137,r=64;let angle=-Math.PI/2;
  if(!data.total){ctx.fillStyle='#ddd3c5';ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.fill()}
  data.ratios.forEach((p,i)=>{if(!p)return;ctx.fillStyle=colors[i];ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+2*Math.PI*p);ctx.closePath();ctx.fill();angle+=2*Math.PI*p});
  rarities.forEach((name,i)=>{const y=83+i*39;ctx.fillStyle=colors[i];ctx.fillRect(787,y-12,12,12);ctx.fillStyle='#79583f';ctx.font='14px "Microsoft YaHei",sans-serif';ctx.fillText(name[0].toUpperCase()+name.slice(1),806,y);ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillText(percent(data.ratios[i])+' · '+data.counts[i]+' 件',806,y+16)});
  ctx.fillStyle='#8e5e43';ctx.font='bold 16px "Microsoft YaHei",sans-serif';ctx.fillText('称号：'+data.title,635,258);
  ctx.fillStyle='#8e7b6a';ctx.font='13px "Microsoft YaHei",sans-serif';ctx.fillText('库存欧非参考，含合成影响',635,294);
  ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillText(data.unknown?'未识别稀有度 '+data.unknown+' 件，暂不评级':data.total<30?'库存量较少，等级波动较大':'占比按拥有件数统计，不按收集种类统计',30,335);
 }
 return {rarities,probabilities,weights,colors,titles,comments,headerHeight,lines,composition,assess,synthesis,prepare,draw};
})();
