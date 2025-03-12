const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');


let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // ปิด context isolation เพื่อใช้ // console.log
    },
  });


  win.loadURL('http://localhost:3000'); 


  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(() => {
  // เริ่มเซิร์ฟเวอร์ Next.js ในเบื้องหลังหากยังไม่ได้เริ่ม
  const serverProcess = exec('npm run start', (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
    // console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });

  createWindow();

  // จัดการเมื่อปิดหน้าต่าง
  app.on('window-all-closed', () => {
    // ปิดเซิร์ฟเวอร์ Next.js ถ้ามี
    if (serverProcess) {
      serverProcess.kill();
      // console.log('Server stopped.');
    }
  
    // ปิดโปรเซส ADB ถ้ามี
    exec('taskkill /F /IM adb.exe', (err, stdout, stderr) => {
      if (err) {
        console.error(`ADB kill error: ${err}`);
        return;
      }
      // console.log('ADB process terminated.');
    });
  
    // ปิดโปรเซส Node ถ้ามี
    exec('taskkill /F /IM node.exe', (err, stdout, stderr) => {
      if (err) {
        console.error(`Node kill error: ${err}`);
        return;
      }
      // console.log('Node process terminated.');
    });
  
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
