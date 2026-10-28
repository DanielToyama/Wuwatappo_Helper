const assert=require('node:assert/strict'),crypto=require('node:crypto');
const spec={functionOffset:0x12df0,functionBytes:7556,functionSha256:'0cbd1c0c6159f437733d9efdbc2819ba622478c5f5b90596c2a86a06d2001411',channel:'wt-raw-mouse',tables:[{offset:0x45d6460-0x1200,rva:0x45d6460,press:0x13dd1,release:0x13fdf},{offset:0x45d644c-0x1200,rva:0x45d644c,press:0x140f1,release:0x14113}],names:[{offset:0x137e3,rva:0x143e3,reg:'rcx'},{offset:0x13833,rva:0x14433,reg:'r8'},{offset:0x14287,rva:0x14e87,reg:'rcx'},{offset:0x142d3,rva:0x14ed3,reg:'r8'}]};
function apply(source,input){
 assert.equal(crypto.createHash('sha256').update(source.subarray(spec.functionOffset,spec.functionOffset+spec.functionBytes)).digest('hex'),spec.functionSha256,'Unreviewed native mouse dispatcher');
 const pe=source.readUInt32LE(0x3c),optional=pe+24,number=source.readUInt16LE(pe+6),table=optional+source.readUInt16LE(pe+20),sectionAlign=source.readUInt32LE(optional+32),fileAlign=source.readUInt32LE(optional+36),align=(n,a)=>Math.ceil(n/a)*a;
 const last=table+(number-1)*40,rva=align(source.readUInt32LE(last+12)+Math.max(source.readUInt32LE(last+8),source.readUInt32LE(last+16)),sectionAlign),raw=align(source.length,fileAlign),header=table+number*40;
 assert(header+40<=source.readUInt32LE(optional+60),'No room for section header');assert(source.subarray(header,header+40).every(x=>x===0));
 const code=[],rel=(op,target)=>{const at=rva+code.length;code.push(...op);const b=Buffer.alloc(4);b.writeInt32LE(target-(at+op.length+4));code.push(...b)},emit=(...b)=>code.push(...b),nameFixups=[],edits=[];
 for(const t of spec.tables)for(const[kind,index,target]of [['press',2,t.press],['release',3,t.release]]){
  const slot=t.offset+index*4;assert.equal(source.readInt32LE(slot)+t.rva,target,'Native dispatch table mismatch');const entry=rva+code.length;
  emit(0x80,0x7b,0x39,0x01);rel([0x0f,0x85],target);if(kind==='press')emit(0x48,0x83,0xc3,0x39);rel([0xe9],kind==='press'?0x1436f:0x14e0c);
  const b=Buffer.alloc(4);b.writeInt32LE(entry-t.rva);edits.push({name:'Route right '+kind+' to raw input (other buttons keep original routing)',offset:slot,after:b});
 }
 for(const n of spec.names){
  const original=source.subarray(n.offset,n.offset+7);assert.equal(original.subarray(0,3).toString('hex'),n.reg==='rcx'?'488d0d':'4c8d05');const originalName=n.rva+7+original.readInt32LE(3),entry=rva+code.length;
  emit(0x80,0x3b,0x01);emit(0x75,0x0c);const fixup=code.length;emit(...(n.reg==='rcx'?[0x48,0x8d,0x0d]:[0x4c,0x8d,0x05]),0,0,0,0);nameFixups.push(fixup);rel([0xe9],n.rva+7);
  rel(n.reg==='rcx'?[0x48,0x8d,0x0d]:[0x4c,0x8d,0x05],originalName);rel([0xe9],n.rva+7);
  const jump=Buffer.from([0xe9,0,0,0,0,0x90,0x90]);jump.writeInt32LE(entry-(n.rva+5),1);edits.push({name:'Use isolated channel for right mouse input',offset:n.offset,after:jump});
 }
 const nameRva=rva+code.length;emit(...Buffer.from(spec.channel));const body=Buffer.from(code);for(const pos of nameFixups)body.writeInt32LE(nameRva-(rva+pos+7),pos+3);
 const section=Buffer.alloc(40);section.write('.wtraw');section.writeUInt32LE(body.length,8);section.writeUInt32LE(rva,12);section.writeUInt32LE(align(body.length,fileAlign),16);section.writeUInt32LE(raw,20);section.writeUInt32LE(0x60000020,36);
 const count=Buffer.alloc(2);count.writeUInt16LE(number+1);const imageSize=Buffer.alloc(4);imageSize.writeUInt32LE(align(rva+body.length,sectionAlign));edits.push({name:'Add executable raw-input section',offset:header,after:section},{name:'Section count',offset:pe+6,after:count},{name:'Image size',offset:optional+56,after:imageSize});
 const output=Buffer.alloc(raw+align(body.length,fileAlign));input.copy(output);body.copy(output,raw);const changes=edits.map(e=>({name:e.name,offset:e.offset,before:source.subarray(e.offset,e.offset+e.after.length).toString('hex'),after:e.after.toString('hex')}));
 for(const e of edits)e.after.copy(output,e.offset);changes.push({name:'Raw input section bytes',offset:source.length,before:'',after:output.subarray(source.length).toString('hex')});
 return {output,changes,sectionRva:rva,sectionOffset:raw,codeBytes:body.length};
}
module.exports={spec,apply};
