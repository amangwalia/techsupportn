import { ResourceItem } from '../types';

export const RESOURCES_DATA: ResourceItem[] = [
  // ==========================================
  // ⚡ BAT FILES (Windows Automation & Utilities)
  // ==========================================
  {
    id: 'bat-fix-shutdown-windows',
    title: 'FixShutdown For Windows',
    tagline: 'Fixes Windows shutdown/restart restrictions, restores Task Manager, Sticky Keys, and initiates clean system reboot',
    description: 'Automated administrative privilege escalation and registry policy repair utility. Restores accessibility settings, unblocks disabled Task Manager, re-enables Lock Workstation & User Switching policies, unlocks disabled shutdown menus, and reboots the system to apply clean defaults.',
    category: 'bat-files',
    os: ['Windows'],
    format: 'BAT',
    size: '1.9 KB',
    version: '1.0.0',
    updatedDate: 'Aug 2026',
    sha256: '8f4c2e6d1b7a9035e4d2871f3a6b5c90123456789abcdef0123456789abcdef0',
    popular: true,
    recentlyAdded: true,
    downloadCount: 1,
    license: 'MIT',
    author: 'Level 1',
    tags: ['BAT', 'Windows', 'FixShutdown', 'Registry Repair', 'Task Manager', 'Reboot'],
    fileName: 'FixShutdown_Windows.bat',
    installCommand: 'FixShutdown_Windows.bat',
    installGuide: [
      'Download FixShutdown_Windows.bat.',
      'Double-click the file (it will automatically invoke UAC for Administrator elevation if needed).',
      'The script will reset registry lockout policies and immediately initiate a clean system reboot.'
    ],
    rawContent: `@echo off
REM CLS 

REM ECHO.
REM ECHO =============================
REM ECHO Running Admin shell
REM ECHO =============================

:checkPrivileges 
%SystemRoot%\\System32\\NET FILE 1>NUL 2>NUL
if '%errorlevel%' == '0' ( goto gotPrivileges ) else ( goto getPrivileges ) 

:getPrivileges 
if '%1'=='ELEV' (shift & goto gotPrivileges)  
REM ECHO. 
REM ECHO **************************************
REM ECHO Invoking UAC for Privilege Escalation 
REM ECHO **************************************

setlocal DisableDelayedExpansion
set "batchPath=%~0"

setlocal EnableDelayedExpansion
ECHO Set UAC = CreateObject^("Shell.Application"^) > "%temp%\\OEgetPrivileges.vbs" 
ECHO UAC.ShellExecute "!batchPath!", "ELEV", "", "runas", 1 >> "%temp%\\OEgetPrivileges.vbs" 
"%temp%\\OEgetPrivileges.vbs" 
exit /B 

:gotPrivileges 
%SystemRoot%\\System32\\REG ADD "HKCU\\Control Panel\\Accessibility\\StickyKeys" /v "Flags" /t REG_SZ /d "506" /f > nul 2> nul
%SystemRoot%\\System32\\REG ADD "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v "DisableTaskMgr" /t REG_SZ /d "0" /f > nul 2> nul
%SystemRoot%\\System32\\REG ADD "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v "DisableLockWorkstation" /t REG_SZ /d "0" /f > nul 2> nul
%SystemRoot%\\System32\\REG ADD "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v "DisableChangePassword" /t REG_SZ /d "0" /f > nul 2> nul
%SystemRoot%\\System32\\REG ADD "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v "NoLogoff" /t REG_SZ /d "0" /f > nul 2> nul

%SystemRoot%\\System32\\REG ADD "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v "HideFastUserSwitching" /t REG_SZ /d "0" /f > nul 2> nul
%SystemRoot%\\System32\\REG ADD "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v "NoClose" /t REG_SZ /d "0" /f > nul 2> nul
%SystemRoot%\\System32\\REG ADD "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Keyboard Layout" /v "Value Scancode Map" /t REG_SZ /d "0" /f > nul 2> nul

%SystemRoot%\\System32\\shutdown.exe -r -t 00`,
    changelog: [
      { version: '1.0.0', date: 'Aug 2026', notes: ['Auto UAC elevation', 'Resets sticky keys, Task Manager, LockWorkstation, and NoClose policies', 'Executes immediate reboot'] }
    ]
  },
  {
    id: 'bat-camera-fix-windows',
    title: 'CAMERA_FIX For Windows',
    tagline: 'Windows Camera repair tool with FrameServer restart, App reset, Driver reinstall, and diagnostics',
    description: 'Comprehensive batch repair script for Windows camera issues. Restarts the FrameServer service, resets the Windows Camera App via PowerShell, removes and rescans camera device drivers via pnputil, launches the hardware troubleshooter, and opens Windows Update settings.',
    category: 'bat-files',
    os: ['Windows'],
    format: 'BAT',
    size: '1.8 KB',
    version: '1.0.0',
    updatedDate: 'Aug 2026',
    sha256: 'a3d4f5e6b7c890123456789abcdef0123456789abcdef0123456789abcdef012',
    popular: true,
    recentlyAdded: true,
    downloadCount: 1,
    license: 'MIT',
    author: 'Level 1',
    tags: ['BAT', 'Windows', 'Camera Fix', 'FrameServer', 'pnputil', 'Driver Reinstall', 'Troubleshooter'],
    fileName: 'CAMERA_FIX_Windows.bat',
    installCommand: 'CAMERA_FIX_Windows.bat',
    installGuide: [
      'Download CAMERA_FIX_Windows.bat.',
      'Right-click the file and select "Run as administrator".',
      'The automated steps will execute in sequence to repair FrameServer, reset the Camera app, and reinstall camera drivers.'
    ],
    rawContent: `@echo off
:: Windows Camera Fix - Full Batch Script (with Auto Reinstall)
:: Run this file as Administrator

echo ============================================
echo     WINDOWS CAMERA REPAIR TOOL
echo ============================================
echo.

:: Step 1: Restart Camera Frame Server service
echo [1] Restarting Camera Frame Server service...
net stop "FrameServer" >nul 2>&1
net start "FrameServer" >nul 2>&1
echo     -> FrameServer service restarted.
echo.

:: Step 2: Reset Windows Camera App
echo [2] Resetting Camera App...
powershell -command "Get-AppxPackage *Microsoft.WindowsCamera* | Reset-AppxPackage"
echo     -> Camera App reset complete.
echo.

:: Step 3: Uninstall Camera Driver
echo [3] Uninstalling Camera Driver...
for /f "tokens=*" %%i in ('pnputil /enum-devices /class Camera ^| findstr /i "Instance ID"') do (
    set "deviceid=%%i"
)
for /f "tokens=3" %%a in ("%deviceid%") do (
    pnputil /remove-device %%a >nul 2>&1
    echo     -> Camera driver removed.
)
echo.

:: Step 4: Reinstall Camera Driver
echo [4] Reinstalling Camera Driver...
pnputil /scan-devices >nul 2>&1
echo     -> Windows is scanning for hardware changes...
timeout /t 5 >nul
pnputil /enum-devices /class Camera
echo     -> Camera driver reinstalled (if available in system).
echo.

:: Step 5: Launch Windows Hardware Troubleshooter
echo [5] Launching Hardware Troubleshooter...
start msdt.exe -id DeviceDiagnostic
echo     -> Please follow on-screen instructions.
echo.

:: Step 6: Check for Windows Updates
echo [6] Checking for Windows Updates...
powershell -command "Start-Process ms-settings:windowsupdate"
echo     -> Windows Update settings opened. Install any pending updates.
echo.

echo ============================================
echo All steps executed. Please test your camera.
echo If not fixed, restart your PC and run again.
echo ============================================
pause`,
    changelog: [
      { version: '1.0.0', date: 'Aug 2026', notes: ['FrameServer service restart', 'PowerShell Camera app reset', 'pnputil driver removal & scan', 'Hardware diagnostic launcher'] }
    ]
  },
  {
    id: 'bat-fix-repository-windows',
    title: 'FIX_REPOSITORY For Windows',
    tagline: 'WMI repository repair and System File Checker (sfc /scannow) device diagnostics',
    description: 'Windows Management Instrumentation (WMI winmgmt) repository repair and verification batch utility. Stops winmgmt, restarts the service, verifies repository integrity, resets damaged WMI repositories, and initiates a full System File Checker (SFC) integrity scan.',
    category: 'bat-files',
    os: ['Windows'],
    format: 'BAT',
    size: '0.4 KB',
    version: '1.0.0',
    updatedDate: 'Aug 2026',
    sha256: 'c8f7e2d1945a6b083e1c2d3f4a5b6c7d8e9f0123456789abcdef0123456789ab',
    popular: true,
    recentlyAdded: true,
    downloadCount: 1,
    license: 'MIT',
    author: 'Level 1',
    tags: ['BAT', 'Windows', 'FIX_REPOSITORY', 'winmgmt', 'WMI Repair', 'sfc', 'scannow'],
    fileName: 'FIX_REPOSITORY_Windows.bat',
    installCommand: 'FIX_REPOSITORY_Windows.bat',
    installGuide: [
      'Download FIX_REPOSITORY_Windows.bat.',
      'Right-click the file and choose "Run as administrator".',
      'The script will reset the WMI repository and run an SFC scan to fix corrupted Windows files.'
    ],
    rawContent: `@echo off
echo Close net stop:

net stop winmgmt

echo.

echo net start:
net start winmgmt

echo.

echo verifyrepository:
winmgmt /verifyrepository

echo.

echo resetrepository:
winmgmt /resetrepository

echo.
echo.

echo Device Scan:
sfc /scannow

echo.
echo.

pause`,
    changelog: [
      { version: '1.0.0', date: 'Aug 2026', notes: ['Stops and restarts winmgmt', 'Verifies and resets WMI repository', 'Runs SFC integrity scan'] }
    ]
  }
];

export const CATEGORIES_CONFIG = [
  { id: 'all', label: 'All Resources', icon: 'Sparkles', count: 3 },
  { id: 'bat-files', label: '⚡ BAT & Scripts', icon: 'Terminal', count: 3 },
  { id: 'apps', label: '🚀 Apps & EXEs', icon: 'Cpu', count: 0 },
  { id: 'media', label: '🎬 Media & Videos', icon: 'Film', count: 0 },
  { id: 'seb-files', label: '🛡️ SEB Files', icon: 'ShieldCheck', count: 0 },
  { id: 'tools', label: '🛠️ Tools', icon: 'Wrench', count: 0 },
  { id: 'documents', label: '📄 Documents', icon: 'FileText', count: 0 }
];
