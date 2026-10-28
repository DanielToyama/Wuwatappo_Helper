param([Parameter(Mandatory=$true)][string]$ManifestPath)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.IO.Compression;
public static class WuwaPatchedResourceVerifier {
 public static bool Same(byte[] a,byte[] b,int offset,int length){return a.AsSpan(offset,length).SequenceEqual(b.AsSpan(offset,length));}
 public static string Hex(byte[] a,int offset,int length){return Convert.ToHexString(a.AsSpan(offset,length)).ToLowerInvariant();}
 public static string Check(byte[] bytes,int offset,int length,byte[] expected){
  var decoder=new BrotliDecoder();var output=new byte[expected.Length+1];int consumed,written;
  var result=decoder.Decompress(new ReadOnlySpan<byte>(bytes,offset,length),output.AsSpan(),out consumed,out written);
  decoder.Dispose();
  if(result!=System.Buffers.OperationStatus.Done||written!=expected.Length||!output.AsSpan(0,written).SequenceEqual(expected))throw new Exception("Independent decode failed");
  return "Done; consumed="+consumed+"; decoded="+written;
 }
}
'@
$taskManifest=Get-Content -LiteralPath $ManifestPath -Raw|ConvertFrom-Json
$taskBytes=[IO.File]::ReadAllBytes($taskManifest.outputPath)
if((Get-FileHash -LiteralPath $taskManifest.outputPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskManifest.outputSha256){throw 'Output hash mismatch'}
if((Get-FileHash -LiteralPath $taskManifest.sourcePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskManifest.sourceSha256){throw 'Source hash mismatch'}
$taskSource=[IO.File]::ReadAllBytes($taskManifest.sourcePath)
if($taskSource.Length -gt $taskBytes.Length){throw 'Output truncated'}
$taskNativeChecks=@(foreach($taskNative in $taskManifest.nativeChanges){
 $taskLength=$taskNative.after.Length/2
 if($taskNative.before -and [WuwaPatchedResourceVerifier]::Hex($taskSource,$taskNative.offset,$taskNative.before.Length/2) -ne $taskNative.before){throw 'Native source bytes mismatch'}
 if([WuwaPatchedResourceVerifier]::Hex($taskBytes,$taskNative.offset,$taskLength) -ne $taskNative.after){throw 'Native patched bytes mismatch'}
 [pscustomobject]@{Name=$taskNative.name;Offset=$taskNative.offset;Before=$taskNative.before;After=$taskNative.after}
})
$taskRanges=@($taskManifest.changes|ForEach-Object{[pscustomobject]@{Offset=$_.offset;Length=$_.oldCompressedBytes}})+@($taskManifest.nativeChanges|ForEach-Object{[pscustomobject]@{Offset=$_.offset;Length=$_.after.Length/2}})
$taskCursor=0
foreach($taskRange in ($taskRanges|Sort-Object Offset)){
 if(-not [WuwaPatchedResourceVerifier]::Same($taskSource,$taskBytes,$taskCursor,$taskRange.Offset-$taskCursor)){throw 'Unexpected bytes outside declared patches'}
 $taskCursor=$taskRange.Offset+$taskRange.Length
}
if($taskCursor -lt $taskSource.Length -and -not [WuwaPatchedResourceVerifier]::Same($taskSource,$taskBytes,$taskCursor,$taskSource.Length-$taskCursor)){throw 'Unexpected trailing changes'}
if($taskBytes.Length -gt $taskSource.Length -and $taskCursor -ne $taskBytes.Length){throw 'Undeclared appended bytes'}
$taskChecks=foreach($taskChange in $taskManifest.changes){
 [pscustomobject]@{Asset=$taskChange.asset;Result=[WuwaPatchedResourceVerifier]::Check($taskBytes,$taskChange.offset,$taskChange.oldCompressedBytes,[IO.File]::ReadAllBytes($taskChange.jsPath))}
}
$taskVersion=(Get-Item -LiteralPath $taskManifest.outputPath).VersionInfo.FileVersion
if($taskVersion -ne $taskManifest.version){throw 'File version mismatch'}
$taskManifest|Add-Member -Force -NotePropertyName independentDotNetDecode -NotePropertyValue @($taskChecks)
$taskManifest|Add-Member -Force -NotePropertyName outputFileVersion -NotePropertyValue $taskVersion
$taskManifest|Add-Member -Force -NotePropertyName independentNativeChecks -NotePropertyValue $taskNativeChecks
$taskManifest|ConvertTo-Json -Depth 7|Set-Content -LiteralPath $ManifestPath -Encoding utf8
[pscustomobject]@{OutputVersion=$taskVersion;SourceUnchanged=$true;OutputHashMatches=$true;Resources=$taskChecks}|ConvertTo-Json -Depth 4
