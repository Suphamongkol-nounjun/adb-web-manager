const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const http = require("http");

let serverProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  // เปิดลิงก์ localhost:3000
  win.loadURL("http://localhost:3000");
}

// ฟังก์ชันสำหรับปิดโปรเซสตามชื่อ
function killProcess(processName) {
  exec(`taskkill /F /IM "${processName}"`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error killing ${processName}: ${err.message}`);
      return;
    }
    console.log(`${processName} terminated.`);
  });
}

// ฟังก์ชันตรวจสอบว่าเซิร์ฟเวอร์พร้อมหรือยัง
function waitForServerReady(url, callback) {
  const checkServer = () => {
    http
      .get(url, (res) => {
        if (res.statusCode === 200) {
          console.log("Server is ready!");
          callback();
        } else {
          console.log("Waiting for server...");
          setTimeout(checkServer, 1000);
        }
      })
      .on("error", () => {
        console.log("Waiting for server...");
        setTimeout(checkServer, 1000);
      });
  };
  checkServer();
}

app.whenReady().then(() => {
  // ตรวจสอบพาธว่าไฟล์อยู่ในโฟลเดอร์ที่คาดหวัง
  const serverPath = path.join(process.cwd(), "standalone", "server.js");
  console.log(`Server path: ${serverPath}`);

  // ตรวจสอบว่าพาธถูกต้องหรือไม่
  const fs = require("fs");
  if (!fs.existsSync(serverPath)) {
    console.error(`Error: ${serverPath} does not exist.`);
    return;
  }

  // รันเซิร์ฟเวอร์ Next.js (Standalone) ในหน้าต่าง cmd แบบพับจอ (Minimize)
  serverProcess = exec(`start /min cmd /K node "${serverPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });

  // รอให้เซิร์ฟเวอร์พร้อมก่อนเปิดหน้าต่างแอป
  waitForServerReady("http://localhost:3000", createWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// จัดการเมื่อปิดหน้าต่าง
app.on("window-all-closed", () => {
  // ปิดเซิร์ฟเวอร์ Next.js ถ้ามี
  if (serverProcess) {
    serverProcess.kill();
    console.log("Next.js server stopped.");
  }

  // ปิดโปรเซส ADB Web Manager
  killProcess("ADB Web Manager.exe");

  // ปิดโปรเซส ADB
  killProcess("adb.exe");

  // ปิดโปรเซส Node.js
  killProcess("node.exe");

  // ปิดโปรเซส CMD ที่รันเซิร์ฟเวอร์
  killProcess("cmd.exe");

  if (process.platform !== "darwin") {
    app.quit();
  }
});
