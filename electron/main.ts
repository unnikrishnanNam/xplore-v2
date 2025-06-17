import { app, BrowserWindow, ipcMain, shell } from "electron";
// import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs";
import os from "os";

// const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
    frame: false, // Remove default OS window frame
    titleBarStyle: "hidden", // Hide the default title bar
    transparent: true, // Make the window transparent
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// IPC handler to list directory contents
ipcMain.handle("list-directory", async (event, dirPath: string) => {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(dirPath, file.name);
        const stat = await fs.promises.stat(fullPath);
        return {
          id: fullPath, // Use full path as unique id
          name: file.name,
          type: file.isDirectory() ? "folder" : "file",
          size: file.isDirectory() ? undefined : stat.size,
          modified: stat.mtime,
          path: fullPath,
        };
      })
    );
    return { success: true, files: fileStats };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-home-dir", () => {
  return os.homedir();
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

ipcMain.handle("open-file", async (_event, filePath: string) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
