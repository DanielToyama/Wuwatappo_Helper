const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),patches=path.join(root,'patches');
const sourcePath=path.resolve(process.argv[2]||'WuwaTappo.exe');
const source=fs.readFileSync(sourcePath),manifest=JSON.parse(fs.readFileSync(path.join(patches,'extraction-manifest.json'),'utf8'));
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
assert.equal(hash(source),manifest.sourceSha256,'Unsupported original executable; expected reviewed WuwaTappo 1.0.1');
const assets=path.join(patches,'assets'),fixtures=path.join(patches,'share-fixtures');fs.mkdirSync(assets,{recursive:true});fs.mkdirSync(fixtures,{recursive:true});
for(const meta of manifest.assets){const decoded=zlib.brotliDecompressSync(source.subarray(meta.offset,meta.offset+meta.compressedBytes));assert.equal(hash(decoded),meta.sha256);fs.writeFileSync(path.join(assets,path.basename(meta.name)),decoded)}
for(const name of ['atlas-thumb-1-BLGUkvwT.png','atlas-thumb-2-CSkXBHLD.png','atlas-thumb-3-Cf7ixdnU.png','atlas-thumb-4-CDuzFic3.png']){
 const key='/assets/'+name,index=source.indexOf(Buffer.from(key));assert(index>=0);const decoded=zlib.brotliDecompressSync(source.subarray(index+key.length));assert.equal(decoded.subarray(0,8).toString('hex'),'89504e470d0a1a0a');fs.writeFileSync(path.join(fixtures,name),decoded);
}
const {createCanvas}=require('@napi-rs/canvas');
for(const [name,color] of [['character_skin','#e799a0'],['accessory','#8bb7df'],['emote','#9ac48b']]){
 const canvas=createCanvas(160,160),ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.beginPath();ctx.arc(80,80,56,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff';ctx.font='bold 20px sans-serif';ctx.fillText('TEST',54,87);fs.writeFileSync(path.join(fixtures,name+'.png'),canvas.toBuffer('image/png'));
}
console.log('Verified original; prepared embedded resources and offline test fixtures.');
