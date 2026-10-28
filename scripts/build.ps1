param(
    [Parameter(Mandatory=$true)][string]$SourceExe,
    [Parameter(Mandatory=$true)][string]$IsccPath,
    [string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceFile = (Resolve-Path -LiteralPath $SourceExe).Path
$compilerFile = (Resolve-Path -LiteralPath $IsccPath).Path
$distDir = if ($OutputDirectory) { [IO.Path]::GetFullPath($OutputDirectory) } else { Join-Path $repoRoot 'dist' }
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
    & (Join-Path $PSScriptRoot 'build-controller-host.ps1') -OutputDirectory $distDir
    if ($LASTEXITCODE -ne 0) { throw 'Controller launcher failed' }
    & (Join-Path $PSScriptRoot 'package.ps1') -IsccPath $compilerFile -OutputDirectory $distDir
} finally { $env:WUWA_SOURCE_EXE = $previousSource }
