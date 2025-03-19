const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

let serverProcess = null;

// ฟังก์ชันสำหรับเช็คว่าพอร์ตถูกใช้งานหรือยัง
function isPortInUse(port, callback) {
  exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
    if (error || stderr) {
      callback(false); // ไม่พบพอร์ตถูกใช้งาน
    } else {
      callback(true); // พบว่าพอร์ตถูกใช้งาน
    }
  });
}

// ฟังก์ชันเลือกพอร์ตที่ไม่ถูกใช้งาน
function getAvailablePort(startPort, callback) {
  isPortInUse(startPort, (inUse) => {
    if (inUse) {
      console.log(`Port ${startPort} is in use, trying port ${startPort + 1}`);
      callback(startPort + 1); // ใช้พอร์ตถัดไป
    } else {
      callback(startPort); // ใช้พอร์ตที่กำหนด
    }
  });
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  // เปิดลิงก์ localhost:{port}
  win.loadURL(`http://localhost:${port}`);
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
  if (!fs.existsSync(serverPath)) {
    console.error(`Error: ${serverPath} does not exist.`);
    return;
  }

  // หา port ที่ใช้งานได้เริ่มจาก 3000
  getAvailablePort(3000, (availablePort) => {
    if (availablePort === 3000) {
      console.log(`Port 3000 is available, starting server on port 3000`);

      // รันเซิร์ฟเวอร์ Next.js (Standalone) ในหน้าต่าง cmd แบบพับจอ (Minimize)
      serverProcess = exec(`start /min cmd /K node "${serverPath}" --port ${availablePort}`, (error, stdout, stderr) => {
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
    } else {
      console.log(`Port 3000 is in use, starting server on port ${availablePort}`);

      // รันเซิร์ฟเวอร์ Next.js (Standalone) ในหน้าต่าง cmd แบบพับจอ (Minimize)
      serverProcess = exec(`start /min cmd /K node "${serverPath}" --port ${availablePort}`, (error, stdout, stderr) => {
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
    }

    // รอให้เซิร์ฟเวอร์พร้อมก่อนเปิดหน้าต่างแอป
    waitForServerReady(`http://localhost:${availablePort}`, () => createWindow(availablePort));
  });

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
