#ifndef SourceDir
  #define SourceDir "..\dist"
#endif
#ifndef OutputDir
  #define OutputDir "..\dist"
#endif
#ifndef AppVersion
  #define AppVersion "1.0.2.1"
#endif

[Setup]
AppId={{72710F2E-C20B-4D14-B98A-12E592DD3315}
AppName=Wuwatappo_Helper
AppVersion={#AppVersion}
AppPublisher=Fantasicrap
AppPublisherURL=https://github.com/Fantasicrap/Wuwatappo_Helper
AppSupportURL=https://github.com/Fantasicrap/Wuwatappo_Helper/issues
DefaultDirName={localappdata}\Programs\Wuwatappo_Helper
DefaultGroupName=Wuwatappo_Helper
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
DisableProgramGroupPage=yes
DisableDirPage=no
WizardStyle=modern
Compression=lzma2
SolidCompression=yes
OutputDir={#OutputDir}
OutputBaseFilename=Wuwatappo_Helper-{#AppVersion}-Setup
UninstallDisplayIcon={app}\Wuwatappo_Helper.exe
LicenseFile=..\DISCLAIMER.txt
InfoAfterFile=..\docs\使用说明.md
SetupLogging=yes
CloseApplications=yes
RestartApplications=no
Uninstallable=not IsPackageTest
CreateUninstallRegKey=not IsPackageTest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; Flags: unchecked; Check: not IsPackageTest

[Files]
Source: "{#SourceDir}\Wuwatappo_Helper.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\DISCLAIMER.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\THIRD_PARTY_NOTICES.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\docs\使用说明.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Wuwatappo_Helper"; Filename: "{app}\Wuwatappo_Helper.exe"; Check: not IsPackageTest
Name: "{group}\使用说明"; Filename: "{app}\使用说明.md"; Check: not IsPackageTest
Name: "{autodesktop}\Wuwatappo_Helper"; Filename: "{app}\Wuwatappo_Helper.exe"; Tasks: desktopicon; Check: not IsPackageTest

[Run]
Filename: "{app}\Wuwatappo_Helper.exe"; Description: "运行 Wuwatappo_Helper"; Flags: nowait postinstall skipifsilent unchecked

[Code]
function IsPackageTest: Boolean;
begin
  Result := ExpandConstant('{param:PACKAGE_TEST|0}') = '1';
end;
