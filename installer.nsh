!include "MUI2.nsh"

Section "Install Additional Tools"
  DetailPrint "Installing additional software..."

  ; เรียกใช้งานโปรแกรม ADB Tools (MSI)
  DetailPrint "Installing Node.js..."
  ExecWait 'msiexec /i "$INSTDIR\standalone\src\adb-tools-setup\node-v22.14.0-x64.msi"'
  DetailPrint "Node.js installation completed."

  ; เรียกใช้งานโปรแกรม Nmap (EXE)
  DetailPrint "Installing Nmap..."
  ExecWait 'cmd /C "$INSTDIR\standalone\src\adb-tools-setup\nmap-7.95-setup.exe" /S'
  DetailPrint "Nmap installation completed."

SectionEnd
