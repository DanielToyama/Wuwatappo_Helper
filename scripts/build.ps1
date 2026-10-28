param(
    [Parameter(Mandatory=$true)][string]$SourceExe,
    [Parameter(Mandatory=$true)][string]$IsccPath
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceFile = (Resolve-Path -LiteralPath $SourceExe).Path
$compilerFile = (Resolve-Path -LiteralPath $IsccPath).Path
$distDir = Join-Path $repoRoot 'dist'
New-Item -ItemType Directory -Path $distDir -Force | Out-Null
$previousSource = $env:WUWA_SOURCE_EXE
try {
    $env:WUWA_SOURCE_EXE = $sourceFile
    & node (Join-Path $PSScriptRoot 'prepare-source.cjs') $sourceFile
    if ($LASTEXITCODE -ne 0) { throw 'Resource preparation failed' }
    & node (Join-Path $repoRoot 'patches/build-auto-chest.cjs') --helper-release
    if ($LASTEXITCODE -ne 0) { throw 'Patch build failed' }
    $manifestFile = Join-Path $repoRoot 'patches/helper-release/patch-manifest.json'
    & (Join-Path $repoRoot 'patches/verify-patched-exe.ps1') -ManifestPath $manifestFile
    if ($LASTEXITCODE -ne 0) { throw 'Independent resource verification failed' }
    & node (Join-Path $PSScriptRoot 'test-migration.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Migration checks failed' }
    Copy-Item -LiteralPath (Join-Path $repoRoot 'patches/helper-release/Wuwatappo_Helper.exe') -Destination (Join-Path $distDir 'Wuwatappo_Helper.exe') -Force
    & (Join-Path $PSScriptRoot 'package.ps1') -IsccPath $compilerFile
} finally { $env:WUWA_SOURCE_EXE = $previousSource }
