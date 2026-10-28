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
 // Supplement left events outside native hit regions without stealing drag handling.
 const leftHook=rva+code.length,leftExits=[],leftStrings=[];
 const exit=op=>{leftExits.push(code.length+op.length);rel(op,0)};
 emit(0x0f,0xb6,0x43,0x38,0x83,0xe8,0x02,0x83,0xf8,0x01);exit([0x0f,0x87]);
 emit(0x80,0x7b,0x39,0x00);exit([0x0f,0x85]);
 rel([0xe8],0x204a30);emit(0x84,0xc0);exit([0x0f,0x84]);
 rel([0xe8],0x204b80);emit(0x84,0xc0);exit([0x0f,0x85]);
 const str=(op,text)=>{leftStrings.push({at:code.length,op,text});rel(op,0)};
 str([0x48,0x8d,0x0d],'left');emit(0xba,4,0,0,0);str([0x4c,0x8d,0x05],'press');emit(0x41,0xb9,5,0,0,0);
 emit(0x80,0x7b,0x38,2,0x74,13);str([0x4c,0x8d,0x05],'release');emit(0x41,0xb9,7,0,0,0);
 rel([0xe8],0x203de0);const resume=rva+code.length;rel([0xe8],0xb0f8f0);rel([0xe9],0x13a24);const hookEnd=rva+code.length;
 for(const pos of leftExits){const b=Buffer.alloc(4);b.writeInt32LE(resume-(rva+pos+4));for(let j=0;j<4;j++)code[pos+j]=b[j]}
 for(const fix of leftStrings){const target=rva+code.length;emit(...Buffer.from(fix.text));const b=Buffer.alloc(4);b.writeInt32LE(target-(rva+fix.at+7));for(let j=0;j<4;j++)code[fix.at+3+j]=b[j]}
 const hookJump=Buffer.alloc(5);hookJump[0]=0xe9;hookJump.writeInt32LE(leftHook-0x13a24,1);assert.equal(source[0x12e1f],0xe8);edits.push({name:'Supplement global left press/release outside native overlay',offset:0x12e1f,after:hookJump});
 const nameRva=rva+code.length;emit(...Buffer.from(spec.channel));let body=Buffer.from(code);for(const pos of nameFixups)body.writeInt32LE(nameRva-(rva+pos+7),pos+3);
 const exceptionDir=optional+112+3*8,exceptionRva=source.readUInt32LE(exceptionDir),exceptionBytes=source.readUInt32LE(exceptionDir+4);
 const rvaOffset=value=>{for(let i=0;i<number;i++){const h=table+i*40,va=source.readUInt32LE(h+12),bytes=source.readUInt32LE(h+16);if(value>=va&&value<va+bytes)return source.readUInt32LE(h+20)+value-va}throw Error('Unmapped RVA')};
 const exceptions=source.subarray(rvaOffset(exceptionRva),rvaOffset(exceptionRva)+exceptionBytes);let unwind=0;for(let i=0;i<exceptions.length;i+=12)if(exceptions.readUInt32LE(i)===0x139f0)unwind=exceptions.readUInt32LE(i+8);assert(unwind);
 const extra=Buffer.alloc(12);extra.writeUInt32LE(leftHook,0);extra.writeUInt32LE(hookEnd,4);extra.writeUInt32LE(unwind,8);const tableAt=align(body.length,4),padded=Buffer.alloc(tableAt);body.copy(padded);body=Buffer.concat([padded,exceptions,extra]);
 const directory=Buffer.alloc(8);directory.writeUInt32LE(rva+tableAt);directory.writeUInt32LE(exceptions.length+12,4);edits.push({name:'Unwind table including left-input supplement',offset:exceptionDir,after:directory});
 const section=Buffer.alloc(40);section.write('.wtraw');section.writeUInt32LE(body.length,8);section.writeUInt32LE(rva,12);section.writeUInt32LE(align(body.length,fileAlign),16);section.writeUInt32LE(raw,20);section.writeUInt32LE(0x60000020,36);
 const count=Buffer.alloc(2);count.writeUInt16LE(number+1);const imageSize=Buffer.alloc(4);imageSize.writeUInt32LE(align(rva+body.length,sectionAlign));edits.push({name:'Add executable raw-input section',offset:header,after:section},{name:'Section count',offset:pe+6,after:count},{name:'Image size',offset:optional+56,after:imageSize});
 const output=Buffer.alloc(raw+align(body.length,fileAlign));input.copy(output);body.copy(output,raw);const changes=edits.map(e=>({name:e.name,offset:e.offset,before:source.subarray(e.offset,e.offset+e.after.length).toString('hex'),after:e.after.toString('hex')}));
 for(const e of edits)e.after.copy(output,e.offset);changes.push({name:'Raw input section bytes',offset:source.length,before:'',after:output.subarray(source.length).toString('hex')});
 return {output,changes,sectionRva:rva,sectionOffset:raw,codeBytes:body.length,leftHook,hookEnd};
}
module.exports={spec,apply};
