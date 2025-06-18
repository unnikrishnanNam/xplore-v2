import { app, BrowserWindow, ipcMain, shell } from "electron";
// import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs";
import os from "os";
import pty from "node-pty";

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

// Terminal management
let shellPty: pty.IPty | null = null;

function createPty(win: BrowserWindow) {
  // Kill existing PTY if it exists
  if (shellPty) {
    console.log("Killing existing terminal process");
    shellPty.kill();
    shellPty = null;
  }

  const shell =
    process.env.SHELL ||
    (process.platform === "win32" ? "powershell.exe" : "bash");

  console.log("Creating new terminal process with shell:", shell);

  shellPty = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env as Record<string, string>,
  });

  shellPty.onData((data) => {
    win.webContents.send("terminal:output", data);
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
ipcMain.handle("list-directory", async (_event, dirPath: string) => {
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle("get-home-dir", () => {
  return os.homedir();
});

// Terminal IPC handlers
ipcMain.handle("terminal:create", (event) => {
  console.log("Terminal create request received");
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    createPty(win);
    return "ok";
  }
  return "error: no window found";
});

ipcMain.on("terminal:input", (_event, data: string) => {
  if (shellPty) {
    shellPty.write(data);
  }
});

ipcMain.on("terminal:resize", (_event, cols: number, rows: number) => {
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

ipcMain.handle("open-file", async (_event, filePath: string) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
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
