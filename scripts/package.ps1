param([Parameter(Mandatory=$true)][string]$IsccPath)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $repoRoot 'dist'
$taskPackage = Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json
$helperVersion = if ($taskPackage.releaseVersion) { $taskPackage.releaseVersion } else { $taskPackage.version }
$compilerFile = (Resolve-Path -LiteralPath $IsccPath).Path
& $compilerFile ('/DSourceDir=' + $distDir) ('/DOutputDir=' + $distDir) ('/DAppVersion=' + $helperVersion) (Join-Path $repoRoot 'installer/Wuwatappo_Helper.iss')
if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed' }
$portableDir = Join-Path $distDir 'portable/Wuwatappo_Helper'
New-Item -ItemType Directory -Path $portableDir -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $distDir 'Wuwatappo_Helper.exe') -Destination $portableDir -Force
foreach ($name in @('README.md','DISCLAIMER.txt','THIRD_PARTY_NOTICES.md')) { Copy-Item -LiteralPath (Join-Path $repoRoot $name) -Destination $portableDir -Force }
Copy-Item -LiteralPath (Join-Path $repoRoot 'docs/使用说明.md') -Destination $portableDir -Force
Compress-Archive -LiteralPath $portableDir -DestinationPath (Join-Path $distDir "Wuwatappo_Helper-$helperVersion-Portable.zip") -Force
$releaseNames = @('Wuwatappo_Helper.exe',"Wuwatappo_Helper-$helperVersion-Setup.exe","Wuwatappo_Helper-$helperVersion-Portable.zip")
$checksums = foreach ($name in $releaseNames) { $digest = (Get-FileHash -LiteralPath (Join-Path $distDir $name) -Algorithm SHA256).Hash.ToLower(); "$digest  $name" }
Set-Content -LiteralPath (Join-Path $distDir 'SHA256SUMS.txt') -Value $checksums -Encoding utf8NoBOM
Write-Output "Release artifacts: $distDir"
