import sys,json,struct,pathlib
import pefile
from unicorn import Uc,UC_ARCH_X86,UC_MODE_64,UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_RBX,UC_X86_REG_RIP,UC_X86_REG_RCX,UC_X86_REG_R8
path=pathlib.Path('patches/helper-release/Wuwatappo_Helper.exe');pe=pefile.PE(str(path));artifact=path.read_bytes();assert artifact[0x24a608:0x24a608+5]==bytes.fromhex('31c0909090'),'Native F7/F8/F9 RegisterHotKey call was not disabled';base=pe.OPTIONAL_HEADER.ImageBase;image=pe.get_memory_mapped_image();u=Uc(UC_ARCH_X86,UC_MODE_64);u.mem_map(base,(len(image)+4095)&~4095);u.mem_write(base,image);data=0x100000;u.mem_map(data,4096)
u.reg_write(UC_X86_REG_RIP,base+0x24b208);u.emu_start(base+0x24b208,base+0x24b240,count=10);assert u.reg_read(UC_X86_REG_RIP)==base+0x24b240,'Patched hotkey call does not take the registration-skipped branch'
cases=[]
def run(start,stop,button,pointer_offset=0):
 u.mem_write(data,b'\x00'*128);u.mem_write(data+pointer_offset,bytes([button]));u.reg_write(UC_X86_REG_RBX,data);u.emu_start(base+start,base+stop,count=30);assert u.reg_read(UC_X86_REG_RIP)==base+stop
for table,oldpress,oldrelease in [(0x45d6460,0x13dd1,0x13fdf),(0x45d644c,0x140f1,0x14113)]:
 for index,original,emit in [(2,oldpress,0x1436f),(3,oldrelease,0x14e0c)]:
  entry=table+struct.unpack('<i',u.mem_read(base+table+index*4,4))[0]
  for button in [0,1,2]:
   stop=emit if button==1 else original;run(entry,stop,button,0x39)
   assert u.reg_read(UC_X86_REG_RBX)==data+(0x39 if button==1 and index==2 else 0)
   cases.append({'native_overlay':table==0x45d6460,'action':'press' if index==2 else 'release','button':button,'target':hex(stop)})
for site,reg in [(0x143e3,UC_X86_REG_RCX),(0x14433,UC_X86_REG_R8),(0x14e87,UC_X86_REG_RCX),(0x14ed3,UC_X86_REG_R8)]:
 for button in [0,1,2]:
  run(site,site+7,button);name=bytes(u.mem_read(u.reg_read(reg),12)).decode();assert name==('wt-raw-mouse' if button==1 else 'mouse-button');cases.append({'name_site':hex(site),'button':button,'channel':name})
report={'passed':True,'engine':'Unicorn x86-64','cases':cases,'nativeHotkeyRegistrationDisabled':True,'nativeHotkeySkipsRegistration':True,'nativeRealGameTested':False};pathlib.Path('dist/native-routing-verification.json').write_text(json.dumps(report,indent=2));print('PASS: 24 actual x64 routing/channel simulations, both overlay modes, press/release and left/right/middle buttons')

from unicorn.x86_const import UC_X86_REG_RSP,UC_X86_REG_RAX,UC_X86_REG_RDX,UC_X86_REG_R9
u.mem_map(0x200000,4096);calls=[];overlay=False;inside=False
def callback(uc,address,size,user):
 if address not in [base+0x204a30,base+0x204b80,base+0x203de0,base+0xb0f8f0]:return
 if address==base+0x203de0:
  button=bytes(uc.mem_read(uc.reg_read(UC_X86_REG_RCX),uc.reg_read(UC_X86_REG_RDX))).decode();action=bytes(uc.mem_read(uc.reg_read(UC_X86_REG_R8),uc.reg_read(UC_X86_REG_R9))).decode();calls.append((button,action))
 uc.reg_write(UC_X86_REG_RAX, int(overlay) if address==base+0x204a30 else int(inside) if address==base+0x204b80 else 0x5678)
 rsp=uc.reg_read(UC_X86_REG_RSP);uc.reg_write(UC_X86_REG_RIP,int.from_bytes(uc.mem_read(rsp,8),'little'));uc.reg_write(UC_X86_REG_RSP,rsp+8)
hook=u.hook_add(UC_HOOK_CODE,callback);left_cases=[]
for overlay in [False,True]:
 for inside in [False,True]:
  for kind in range(5):
   for button in [0,1,2]:
    calls.clear();u.mem_write(data,b'\x00'*128);u.mem_write(data+0x38,bytes([kind,button]));u.reg_write(UC_X86_REG_RBX,data);u.reg_write(UC_X86_REG_RSP,0x200800);u.emu_start(base+0x13a1f,base+0x13a24,count=100)
    expected=[('left','press' if kind==2 else 'release')] if overlay and not inside and kind in [2,3] and button==0 else []
    assert calls==expected,(overlay,inside,kind,button,calls,expected);assert u.reg_read(UC_X86_REG_RAX)==0x5678;assert u.reg_read(UC_X86_REG_RBX)==data
    left_cases.append({'overlay':overlay,'inside':inside,'kind':kind,'button':button,'emitted':list(calls)})
report['leftSupplementCases']=left_cases;report['leftDragRoutingPreserved']=True;pathlib.Path('dist/native-routing-verification.json').write_text(json.dumps(report,indent=2));print('PASS: 60 additional x64 left-event supplement cases; original dispatcher resumes and drag routing remains intact')
