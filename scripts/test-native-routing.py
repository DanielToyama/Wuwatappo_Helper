import sys,json,struct,pathlib
import pefile
from unicorn import Uc,UC_ARCH_X86,UC_MODE_64,UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_RBX,UC_X86_REG_RIP,UC_X86_REG_RCX,UC_X86_REG_R8
path=pathlib.Path('patches/helper-release/Wuwatappo_Helper.exe');pe=pefile.PE(str(path));base=pe.OPTIONAL_HEADER.ImageBase;image=pe.get_memory_mapped_image();u=Uc(UC_ARCH_X86,UC_MODE_64);u.mem_map(base,(len(image)+4095)&~4095);u.mem_write(base,image);data=0x100000;u.mem_map(data,4096)
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
report={'passed':True,'engine':'Unicorn x86-64','cases':cases,'nativeRealGameTested':False};pathlib.Path('dist/native-routing-verification.json').write_text(json.dumps(report,indent=2));print('PASS: 24 actual x64 routing/channel simulations, both overlay modes, press/release and left/right/middle buttons')
