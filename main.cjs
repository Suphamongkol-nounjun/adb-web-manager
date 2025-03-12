const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadURL("http://localhost:3000"); // URL ของ Next.js ที่รันอยู่
}

app.on("ready", createWindow);
