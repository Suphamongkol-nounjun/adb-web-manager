const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');
// const dotenv = require('dotenv');

// โหลด environment variables
// dotenv.config();
let win;
// const environment = process.env.NEXT_PUBLIC_ENV || 'dev'; 
// const environment = process.env.NEXT_PUBLIC_ENV || 'dev';
//   // console.log(`Environment: ${environment}`);

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // ปิด context isolation เพื่อใช้ // console.log
    },
  });


  // ตรวจสอบ environment ว่าเป็นอะไร
  

  // // โหลดแอปจาก server localhost ใน development
  // if (environment === 'dev') {
  //   win.loadURL('http://localhost:3000');
  //   // console.log('Running in Development Mode');
  // } 
  // // สำหรับ UAT
  // else if (environment === 'uat') {
  //   win.loadURL('http://localhost:3000');
  //   // console.log('Running in UAT Mode');
  //   win.webContents.closeDevTools();
  // } 
  // // สำหรับ Production
  // else if (environment === 'prod') {
  //   win.loadURL('http://localhost:3000');
  //   // // console.log('Running in Production Mode');
  //   win.webContents.closeDevTools();
  // } 
  // // ค่าเริ่มต้นหรือ fallback
  // else {
  //   win.loadURL('http://localhost:3000');
  //   // console.log('Running in Unknown Environment, Fallback to Development');
  // }
  

  // โหลด URL ของแอปที่ทำงานอยู่ที่ localhost
  win.loadURL('http://localhost:3000'); // ตรวจสอบว่าแอป React/Next.js รันอยู่ที่นี้หรือไม่

  // ถ้าคุณใช้ไฟล์ build ใน production
  // const prodPath = path.join(__dirname, 'build/production', 'index.html');
  // win.loadFile(prodPath);

  console.log('Application is running');

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
