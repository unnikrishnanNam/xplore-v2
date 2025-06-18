import { ipcMain, BrowserWindow, shell, app } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs";
import os from "os";
import pty from "node-pty";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let shellPty = null;
function createPty(win2) {
  if (shellPty) {
    console.log("Killing existing terminal process");
    shellPty.kill();
    shellPty = null;
  }
  const shell2 = process.env.SHELL || (process.platform === "win32" ? "powershell.exe" : "bash");
  console.log("Creating new terminal process with shell:", shell2);
  shellPty = pty.spawn(shell2, [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env
  });
  shellPty.onData((data) => {
    win2.webContents.send("terminal:output", data);
  });
  shellPty.onExit((exitCode) => {
    console.log("Terminal process exited with code:", exitCode);
    shellPty = null;
  });
}
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    },
    frame: false,
    // Remove default OS window frame
    titleBarStyle: "hidden",
    // Hide the default title bar
    transparent: true
    // Make the window transparent
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.handle("list-directory", async (_event, dirPath) => {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(dirPath, file.name);
        const stat = await fs.promises.stat(fullPath);
        return {
          id: fullPath,
          // Use full path as unique id
          name: file.name,
          type: file.isDirectory() ? "folder" : "file",
          size: file.isDirectory() ? void 0 : stat.size,
          modified: stat.mtime,
          path: fullPath
        };
      })
    );
    return { success: true, files: fileStats };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});
ipcMain.handle("get-home-dir", () => {
  return os.homedir();
});
ipcMain.handle("terminal:create", (event) => {
  console.log("Terminal create request received");
  const win2 = BrowserWindow.fromWebContents(event.sender);
  if (win2) {
    createPty(win2);
    return "ok";
  }
  return "error: no window found";
});
ipcMain.on("terminal:input", (_event, data) => {
  if (shellPty) {
    shellPty.write(data);
  }
});
ipcMain.on("terminal:resize", (_event, cols, rows) => {
  if (shellPty) {
    console.log(`Resizing terminal to ${cols}x${rows}`);
    shellPty.resize(cols, rows);
  }
});
ipcMain.handle("terminal:destroy", () => {
  console.log("Terminal destroy request received");
  if (shellPty) {
    shellPty.kill();
    shellPty = null;
    return "ok";
  }
  return "no terminal to destroy";
});
ipcMain.on("window-minimize", () => {
  if (win) win.minimize();
});
ipcMain.on("window-maximize", () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});
ipcMain.on("window-close", () => {
  if (win) win.close();
});
ipcMain.handle("open-file", async (_event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
