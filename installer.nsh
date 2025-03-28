!include "MUI2.nsh"

; สร้างตัวเลือกให้ผู้ใช้สามารถเลือกติดตั้ง
!define MUI_COMPONENTSPAGE_NODESC
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES

Section "Install Node.js" SecNode
  DetailPrint "Installing Node.js..."
  ExecWait 'msiexec /i "$INSTDIR\standalone\src\adb-tools-setup\node-v22.14.0-x64.msi" /qn'
  DetailPrint "Node.js installation completed."
SectionEnd

Section "Install Nmap" SecNmap
  DetailPrint "Installing Nmap..."
  ExecWait 'cmd /C "$INSTDIR\standalone\src\adb-tools-setup\nmap-7.95-setup.exe" /S'
  DetailPrint "Nmap installation completed."
SectionEnd
