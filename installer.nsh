!include "MUI2.nsh"

Section "Install Node.js" SecNode
  DetailPrint "Installing Node.js..."
  ExecWait 'msiexec /i "$INSTDIR\standalone\src\adb-tools-setup\node.msi"'
  DetailPrint "Node.js installation completed."
SectionEnd

Section "Install Nmap" SecNmap
  DetailPrint "Installing Nmap..."
  ExecWait 'cmd /C "$INSTDIR\standalone\src\adb-tools-setup\nmap.exe"'
  DetailPrint "Nmap installation completed."
SectionEnd
