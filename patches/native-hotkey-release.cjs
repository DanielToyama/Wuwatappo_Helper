const assert=require('node:assert/strict'),crypto=require('node:crypto');
// The upstream 1.0.2 payload registers F7/F8/F9 with RegisterHotKey in a fixed
// three-entry loop. Those registrations keep Windows from delivering the keys
// to other programs. The same VKs are already handled by the payload's
// WH_KEYBOARD_LL hook, whose callback calls CallNextHookEx and therefore does
// not swallow them. Replacing the single registration call with
// `xor eax,eax; nop*3` forces every loop iteration into the dispatcher's
// existing "registration skipped" branch, so the hotkey actions keep working
// through the LL hook while the keys reach other programs again.
const spec={
 offset:0x24a608,
 bytes:5,
 sha256:'f686282953f70bcf8a52cc2db20c22a6c628b343eeda2eb57118754f6e3fec7a',
 targetOffset:0xb0ee3a,
 replacement:Buffer.from([0x31,0xc0,0x90,0x90,0x90])
};
function apply(source,input){
 const region=source.subarray(spec.offset,spec.offset+spec.bytes);
 assert.equal(crypto.createHash('sha256').update(region).digest('hex'),spec.sha256,'Unreviewed native hotkey registration call');
 assert.equal(region[0],0xe8,'Expected a relative call instruction');
 assert.equal(spec.offset+spec.bytes+region.readInt32LE(1),spec.targetOffset,'Native hotkey call target mismatch');
 assert(input.subarray(spec.offset,spec.offset+spec.bytes).equals(region),'Native hotkey registration region was already modified');
 const output=Buffer.from(input);
 spec.replacement.copy(output,spec.offset);
 const change={name:'Skip native global F7/F8/F9 registration; keep LL-hook handling',offset:spec.offset,before:region.toString('hex'),after:spec.replacement.toString('hex')};
 return {output,changes:[change]};
}
module.exports={spec,apply};
