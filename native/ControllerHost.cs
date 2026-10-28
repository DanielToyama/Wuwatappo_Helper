using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using System.Security.Cryptography;
using System.ComponentModel;
[assembly: AssemblyTitle("Wuwatappo Helper")]
[assembly: AssemblyVersion("1.0.2.6")]
[assembly: AssemblyFileVersion("1.0.2.6")]
static class HelperHost {
 const int Port=48642; static volatile bool running=true; static long lastRequest; static readonly object gate=new object(); static readonly Queue<Frame> history=new Queue<Frame>(); static long sequence; static string error=""; static readonly Stopwatch clock=Stopwatch.StartNew(); static readonly Dictionary<uint,Device> devices=new Dictionary<uint,Device>();
 static JavaScriptSerializer Serializer(){return new JavaScriptSerializer { MaxJsonLength=8000000 };}
 [DllImport("kernel32",CharSet=CharSet.Unicode)] static extern bool SetDllDirectory(string path);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_SetHint([MarshalAs(UnmanagedType.LPStr)]string name,[MarshalAs(UnmanagedType.LPStr)]string value);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_Init(uint flags);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_Quit();
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_GetVersion();
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_GetError();
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_PumpEvents();
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_PollEvent(IntPtr e);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_UpdateGamepads();
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_GetJoysticks(out int count);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_free(IntPtr p);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_IsGamepad(uint id);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_OpenGamepad(uint id);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_GetGamepadJoystick(IntPtr pad);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_CloseGamepad(IntPtr pad);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_OpenJoystick(uint id);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_CloseJoystick(IntPtr joy);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_GetJoystickName(IntPtr joy);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern ushort SDL_GetJoystickVendor(IntPtr joy);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern ushort SDL_GetJoystickProduct(IntPtr joy);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_GetGamepadType(IntPtr pad);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_GetNumJoystickButtons(IntPtr joy);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_GetNumJoystickAxes(IntPtr joy);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_GetNumJoystickHats(IntPtr joy);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_GetGamepadButton(IntPtr pad,int button);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern short SDL_GetGamepadAxis(IntPtr pad,int axis);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_GetJoystickButton(IntPtr joy,int button);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern short SDL_GetJoystickAxis(IntPtr joy,int axis);
 [DllImport("SDL3",CallingConvention=CallingConvention.Cdecl)] static extern byte SDL_GetJoystickHat(IntPtr joy,int hat);
 public class State { public uint id; public string name,key,layout,mapping; public ushort vendor,product; public bool[] buttons; public double[] axes; public int[] hats; }
 public class Frame { public long seq,ms; public State[] devices; }
 class Device { public uint id; public IntPtr pad,joy; public string name; public ushort vendor,product; public int buttons,axes,hats,type; }
 static string Utf8(IntPtr p){if(p==IntPtr.Zero)return "";int n=0;while(n<1024&&Marshal.ReadByte(p,n)!=0)n++;byte[] b=new byte[n];Marshal.Copy(p,b,0,n);return Encoding.UTF8.GetString(b);}
 static void Refresh(){int n;IntPtr list=SDL_GetJoysticks(out n);try{var seen=new HashSet<uint>();for(int i=0;i<Math.Min(n,16);i++){uint id=(uint)Marshal.ReadInt32(list,i*4);seen.Add(id);if(devices.ContainsKey(id))continue;var d=new Device {id=id};if(SDL_IsGamepad(id)){d.pad=SDL_OpenGamepad(id);if(d.pad!=IntPtr.Zero){d.joy=SDL_GetGamepadJoystick(d.pad);d.type=SDL_GetGamepadType(d.pad);}}else d.joy=SDL_OpenJoystick(id);if(d.joy==IntPtr.Zero)continue;d.name=Utf8(SDL_GetJoystickName(d.joy));d.vendor=SDL_GetJoystickVendor(d.joy);d.product=SDL_GetJoystickProduct(d.joy);d.buttons=d.pad!=IntPtr.Zero?26:Math.Max(0,Math.Min(64,SDL_GetNumJoystickButtons(d.joy)));d.axes=d.pad!=IntPtr.Zero?6:Math.Max(0,Math.Min(16,SDL_GetNumJoystickAxes(d.joy)));d.hats=d.pad!=IntPtr.Zero?0:Math.Max(0,Math.Min(4,SDL_GetNumJoystickHats(d.joy)));devices[id]=d;}
 foreach(uint id in devices.Keys.Where(id=>!seen.Contains(id)).ToArray()){Close(devices[id]);devices.Remove(id);}}finally{if(list!=IntPtr.Zero)SDL_free(list);}}
 static void Close(Device d){if(d.pad!=IntPtr.Zero)SDL_CloseGamepad(d.pad);else if(d.joy!=IntPtr.Zero)SDL_CloseJoystick(d.joy);}
 static State Read(Device d){var s=new State {id=d.id,name=d.name,vendor=d.vendor,product=d.product,key=d.vendor.ToString("x4")+":"+d.product.ToString("x4")+":"+d.name,layout=d.type>=4&&d.type<=6?"ps":d.type>=7&&d.type<=10?"nintendo":"xbox",mapping=d.pad!=IntPtr.Zero?"standard":"raw",buttons=new bool[d.buttons],axes=new double[d.axes],hats=new int[d.hats]};for(int i=0;i<s.buttons.Length;i++)s.buttons[i]=d.pad!=IntPtr.Zero?SDL_GetGamepadButton(d.pad,i):SDL_GetJoystickButton(d.joy,i);for(int i=0;i<s.axes.Length;i++){short v=d.pad!=IntPtr.Zero?SDL_GetGamepadAxis(d.pad,i):SDL_GetJoystickAxis(d.joy,i);s.axes[i]=Math.Round(d.pad!=IntPtr.Zero&&i>=4?Math.Max(0,(int)v)/32767.0:v<0?v/32768.0:v/32767.0,4);}for(int i=0;i<s.hats.Length;i++)s.hats[i]=SDL_GetJoystickHat(d.joy,i);return s;}
 static bool OriginAllowed(string o){return o==""||o=="http://tauri.localhost"||o=="https://tauri.localhost"||o=="tauri://localhost"||o=="http://127.0.0.1:"+Port;}
 static void Serve(TcpListener listener){while(running){try{TcpClient c=listener.AcceptTcpClient();ThreadPool.QueueUserWorkItem(_=>Reply(c));}catch{if(running)Thread.Sleep(50);}}}
 static void Reply(TcpClient client){using(client){client.ReceiveTimeout=2000;client.SendTimeout=2000;try{var stream=client.GetStream();var reader=new StreamReader(stream,Encoding.ASCII,false,1024,true);string first=reader.ReadLine();if(first==null||first.Length>2048)return;var parts=first.Split(' ');if(parts.Length<2)return;string origin="",line;int len=0;while(!string.IsNullOrEmpty(line=reader.ReadLine())){len+=line.Length;if(len>16000)return;if(line.StartsWith("Origin:",StringComparison.OrdinalIgnoreCase))origin=line.Substring(7).Trim();}int status=200;string type="application/json; charset=utf-8",body;
 if(!OriginAllowed(origin)){status=403;body="{}";}else if(parts[0]=="OPTIONS")body="{}";else if(parts[0]!="GET"){status=405;body="{}";}else if(parts[1]=="/ui.js"){type="text/javascript; charset=utf-8";body=ResourceText("controller-ui.js");}else if(parts[1]=="/health")body=Serializer().Serialize(new {version="1.0.2.6",protocol=1,backend="SDL3",error=error});else if(parts[1].StartsWith("/state?after=")){long after;if(!long.TryParse(parts[1].Substring(13),out after)){status=400;body="{}";}else{Interlocked.Exchange(ref lastRequest,clock.ElapsedMilliseconds);lock(gate){body=Serializer().Serialize(new {protocol=1,seq=sequence,ms=clock.ElapsedMilliseconds,error=error,gap=history.Count>0&&after>0&&after<history.Peek().seq-1,frames=history.Where(f=>f.seq>after).ToArray()});}}}else{status=404;body="{}";}
 byte[] bytes=Encoding.UTF8.GetBytes(body);string headers="HTTP/1.1 "+status+" Response\r\nContent-Type: "+type+"\r\nContent-Length: "+bytes.Length+"\r\nCache-Control: no-store\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\n";
 if(OriginAllowed(origin)&&origin!="")headers+="Access-Control-Allow-Origin: "+origin+"\r\nVary: Origin\r\nAccess-Control-Allow-Methods: GET, OPTIONS\r\nAccess-Control-Allow-Private-Network: true\r\n";byte[] head=Encoding.ASCII.GetBytes(headers+"\r\n");stream.Write(head,0,head.Length);stream.Write(bytes,0,bytes.Length);}catch{}}}
 static string ResourceText(string name){using(var s=Assembly.GetExecutingAssembly().GetManifestResourceStream(name))using(var r=new StreamReader(s,Encoding.UTF8))return r.ReadToEnd();}
 static byte[] Resource(string name){using(var s=Assembly.GetExecutingAssembly().GetManifestResourceStream(name))using(var m=new MemoryStream()){s.CopyTo(m);return m.ToArray();}}
 static string Extract(string name,string folder){byte[] bytes=Resource(name);string path=Path.Combine(folder,name);using(var h=SHA256.Create()){if(File.Exists(path)&&h.ComputeHash(File.ReadAllBytes(path)).SequenceEqual(h.ComputeHash(bytes)))return path;}string temp=path+"."+Process.GetCurrentProcess().Id+".tmp";File.WriteAllBytes(temp,bytes);if(File.Exists(path))File.Delete(path);File.Move(temp,path);return path;}
 // The upstream payload requests requireAdministrator. ShellExecute lets Windows
 // request consent instead of CreateProcess immediately failing with error 740.
 static ProcessStartInfo ChildStartInfo(string payload,string folder){return new ProcessStartInfo(payload){WorkingDirectory=folder,UseShellExecute=true};}
 static bool ElevationCancelled(Win32Exception ex){return ex.NativeErrorCode==1223;}
 [STAThread] static int Main(string[] args){bool created;using(var mutex=new Mutex(true,"Local\\WuwatappoHelperControllerHostV1",out created)){if(!created){if(!args.Contains("--probe"))MessageBox.Show("请先退出正在运行的 Helper（包括托盘进程）再启动新版。","Wuwatappo Helper");return 2;}TcpListener listener=null;Process child=null;IntPtr ev=IntPtr.Zero;bool initialized=false;try{
 string folder=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Wuwatappo_Helper","runtime",ResourceText("runtime-id").Trim());Directory.CreateDirectory(folder);string payload=Extract("WuwaTappo.exe",folder);Extract("SDL3.dll",folder);Extract("SDL3-LICENSE.txt",folder);SetDllDirectory(folder);
 listener=new TcpListener(IPAddress.Loopback,Port);listener.Start();var server=new Thread(()=>Serve(listener));server.IsBackground=true;server.Start();
 SDL_SetHint("SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS","1");SDL_SetHint("SDL_JOYSTICK_HIDAPI","1");initialized=SDL_Init(0x2000);if(!initialized)error=Utf8(SDL_GetError());ev=Marshal.AllocHGlobal(256);
 bool probe=args.Contains("--probe");if(!probe){child=Process.Start(ChildStartInfo(payload,folder));if(child==null)throw new InvalidOperationException("Windows 未返回桌宠进程，请退出旧版后重试。");}long refreshAt=0,probeEnd=clock.ElapsedMilliseconds+60000;
 while(running&&(probe?clock.ElapsedMilliseconds<probeEnd:child!=null&&!child.HasExited)){long now=clock.ElapsedMilliseconds;if(initialized){SDL_PumpEvents();for(int i=0;i<256&&SDL_PollEvent(ev);i++){}if(now-refreshAt>=750){Refresh();refreshAt=now;}if(now-Interlocked.Read(ref lastRequest)<3000){SDL_UpdateGamepads();var frame=new Frame {ms=now,devices=devices.Values.Select(Read).ToArray()};lock(gate){frame.seq=++sequence;history.Enqueue(frame);while(history.Count>256)history.Dequeue();}}}Thread.Sleep(16);}return 0;
 }catch(Win32Exception ex){if(ElevationCancelled(ex)){if(!args.Contains("--probe"))MessageBox.Show("已取消 Windows 权限确认，桌宠未启动。需要使用时，请重新运行 Helper 并确认系统提示。","Wuwatappo Helper");return 3;}if(args.Contains("--probe")){Console.Error.WriteLine(ex.Message);return 1;}MessageBox.Show("启动失败："+ex.Message,"Wuwatappo Helper");return 1;}catch(Exception ex){if(args.Contains("--probe")){Console.Error.WriteLine(ex.Message);return 1;}MessageBox.Show("启动失败："+ex.Message,"Wuwatappo Helper");return 1;}finally{running=false;if(listener!=null)listener.Stop();foreach(var d in devices.Values)Close(d);if(ev!=IntPtr.Zero)Marshal.FreeHGlobal(ev);if(initialized)SDL_Quit();}}}
}
