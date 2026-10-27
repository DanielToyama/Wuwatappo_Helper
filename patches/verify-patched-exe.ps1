param([Parameter(Mandatory=$true)][string]$ManifestPath)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.IO.Compression;
public static class WuwaPatchedResourceVerifier {
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
$taskChecks=foreach($taskChange in $taskManifest.changes){
 [pscustomobject]@{Asset=$taskChange.asset;Result=[WuwaPatchedResourceVerifier]::Check($taskBytes,$taskChange.offset,$taskChange.oldCompressedBytes,[IO.File]::ReadAllBytes($taskChange.jsPath))}
}
$taskVersion=(Get-Item -LiteralPath $taskManifest.outputPath).VersionInfo.FileVersion
if($taskVersion -ne $taskManifest.version){throw 'File version mismatch'}
$taskManifest|Add-Member -Force -NotePropertyName independentDotNetDecode -NotePropertyValue @($taskChecks)
$taskManifest|Add-Member -Force -NotePropertyName outputFileVersion -NotePropertyValue $taskVersion
$taskManifest|ConvertTo-Json -Depth 7|Set-Content -LiteralPath $ManifestPath -Encoding utf8
[pscustomobject]@{OutputVersion=$taskVersion;SourceUnchanged=$true;OutputHashMatches=$true;Resources=$taskChecks}|ConvertTo-Json -Depth 4
