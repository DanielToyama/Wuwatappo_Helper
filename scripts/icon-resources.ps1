# Read only PE resource data. Preserve every original ICO image without redrawing it.
if (-not ('WuwaHelper.IconResources' -as [type])) {
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
namespace WuwaHelper {
 public static class IconResources {
  delegate bool EnumNames(IntPtr module,IntPtr type,IntPtr name,IntPtr parameter);
  [DllImport("kernel32",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr LoadLibraryEx(string path,IntPtr file,uint flags);
  [DllImport("kernel32",EntryPoint="EnumResourceNamesW",SetLastError=true)] static extern bool EnumResourceNames(IntPtr module,IntPtr type,EnumNames callback,IntPtr parameter);
  [DllImport("kernel32",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr FindResource(IntPtr module,IntPtr name,IntPtr type);
  [DllImport("kernel32")] static extern uint SizeofResource(IntPtr module,IntPtr resource);
  [DllImport("kernel32")] static extern IntPtr LoadResource(IntPtr module,IntPtr resource);
  [DllImport("kernel32")] static extern IntPtr LockResource(IntPtr resource);
  [DllImport("kernel32")] static extern bool FreeLibrary(IntPtr module);
  static byte[] Read(IntPtr module,IntPtr name,int type) {
   IntPtr r=FindResource(module,name,new IntPtr(type));
   if(r==IntPtr.Zero)throw new InvalidDataException("Required icon resource missing");
   uint length=SizeofResource(module,r);
   if(length==0||length>16000000)throw new InvalidDataException("Invalid icon resource size");
   byte[] bytes=new byte[length];Marshal.Copy(LockResource(LoadResource(module,r)),bytes,0,bytes.Length);return bytes;
  }
  public static byte[][] ReadAll(string path) {
   IntPtr module=LoadLibraryEx(path,IntPtr.Zero,0x22);
   if(module==IntPtr.Zero)throw new System.ComponentModel.Win32Exception();
   try {
    var names=new List<IntPtr>();EnumNames callback=(m,t,n,p)=>{names.Add(n);return true;};
    EnumResourceNames(module,new IntPtr(14),callback,IntPtr.Zero);GC.KeepAlive(callback);
    var icons=new List<byte[]>();
    foreach(IntPtr name in names){
     byte[] group=Read(module,name,14);
     if(group.Length<6||BitConverter.ToUInt16(group,0)!=0||BitConverter.ToUInt16(group,2)!=1)throw new InvalidDataException("Invalid icon group header");
     int count=BitConverter.ToUInt16(group,4);
     if(count==0||count>256||group.Length<6+count*14)throw new InvalidDataException("Invalid icon group entries");
     var frames=new List<byte[]>();for(int i=0;i<count;i++){int at=6+i*14;byte[] frame=Read(module,new IntPtr(BitConverter.ToUInt16(group,at+12)),3);if(frame.Length!=BitConverter.ToUInt32(group,at+8))throw new InvalidDataException("Icon frame size differs");frames.Add(frame);}
     using(var stream=new MemoryStream())using(var writer=new BinaryWriter(stream)){
      writer.Write((ushort)0);writer.Write((ushort)1);writer.Write((ushort)count);int offset=6+count*16;
      for(int i=0;i<count;i++){writer.Write(group,6+i*14,12);writer.Write(offset);offset+=frames[i].Length;}
      foreach(byte[] frame in frames)writer.Write(frame);icons.Add(stream.ToArray());
     }
    }
    return icons.ToArray();
   } finally {FreeLibrary(module);}
  }
  public static byte[] ReadFirst(string path){byte[][] icons=ReadAll(path);if(icons.Length==0)throw new InvalidDataException("Application icon missing");return icons[0];}
  public static bool MatchesAny(string path,byte[] reference){foreach(byte[] icon in ReadAll(path)){if(icon.Length!=reference.Length)continue;bool same=true;for(int i=0;i<icon.Length;i++)if(icon[i]!=reference[i]){same=false;break;}if(same)return true;}return false;}
 }
}
'@
}
