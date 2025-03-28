const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");
const net = require('net');

let serverProcess = null;
let mainWindow = null;

// Improved port checking using net module
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Find available port starting from given port
async function getAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    console.log(`Port ${port} is in use, trying port ${port + 1}`);
    port++;
  }
  return port;
}

// Create main application window
function createWindow(port) {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Kill process by name (improved with Promise and force tree kill)
function killProcess(processName) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' 
      ? `taskkill /F /IM "${processName}" /T`
      : `pkill -f "${processName}"`;

    exec(command, (err) => {
      if (err) {
        console.error(`Error killing ${processName}:`, err.message);
      } else {
        console.log(`${processName} terminated successfully`);
      }
      resolve();
    });
  });
}

// Check if server is ready
function waitForServerReady(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkServer = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log("Server is ready!");
          resolve();
        } else {
          retryOrReject();
        }
      }).on('error', (err) => {
        retryOrReject(err);
      });
    };

    const retryOrReject = (err) => {
      if (Date.now() - startTime >= timeout) {
        reject(new Error(`Server not ready after ${timeout}ms: ${err?.message || 'Unknown error'}`));
      } else {
        setTimeout(checkServer, 1000);
      }
    };

    checkServer();
  });
}

// Clean up any stale processes before starting
async function cleanupStaleProcesses() {
  console.log('Cleaning up stale processes...');
  await killProcess("node.exe");
  await killProcess("cmd.exe");
  await killProcess("ADB Web Manager.exe");
  await killProcess("adb.exe");
}

// Start the Next.js server
async function startServer(serverPath, port) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32'
      ? `start /min cmd /K node "${serverPath}" --port ${port}`
      : `xterm -e "node '${serverPath}' --port ${port}"`;

    serverProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Server process error: ${error.message}`);
        reject(error);
      }
      if (stderr) {
        console.error(`Server stderr: ${stderr}`);
      }
      console.log(`Server stdout: ${stdout}`);
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    resolve(serverProcess);
  });
}

// Main application lifecycle
app.whenReady().then(async () => {
  try {
    // Clean up any existing processes
    await cleanupStaleProcesses();

    // Check server path
    const serverPath = path.join(process.cwd(), "standalone", "server.js");
    console.log(`Server path: ${serverPath}`);

    if (!fs.existsSync(serverPath)) {
      throw new Error(`Server file not found at ${serverPath}`);
    }

    // Get available port
    const availablePort = await getAvailablePort(3000);
    console.log(`Starting server on port ${availablePort}`);

    // Start server
    await startServer(serverPath, availablePort);

    // Wait for server to be ready
    await waitForServerReady(`http://localhost:${availablePort}`);

    // Create main window
    createWindow(availablePort);
  } catch (error) {
    console.error('Application startup failed:', error);
    app.quit();
  }
});

// Handle macOS window activation
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle application shutdown
app.on("window-all-closed", async () => {
  // Kill server process if exists
  if (serverProcess) {
    console.log('Stopping server process...');
    serverProcess.kill();
  }

  // Kill related processes
  await killProcess("ADB Web Manager.exe");
  await killProcess("adb.exe");
  await killProcess("node.exe");
  await killProcess("cmd.exe");

  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle unexpected crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});