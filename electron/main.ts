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

// File operations handlers
ipcMain.handle(
  "create-file",
  async (_event, filePath: string, content = "") => {
    try {
      // Ensure the directory exists
      const directory = path.dirname(filePath);
      await fs.promises.mkdir(directory, { recursive: true });

      // Check if file already exists
      try {
        await fs.promises.access(filePath);
        return { success: false, error: "File already exists" };
      } catch {
        // File doesn't exist, which is what we want
      }

      // Create the file with the specified content
      await fs.promises.writeFile(filePath, content, "utf8");

      // Get file stats for return
      const stat = await fs.promises.stat(filePath);
      const fileInfo = {
        id: filePath,
        name: path.basename(filePath),
        type: "file" as const,
        size: stat.size,
        modified: stat.mtime,
        path: filePath,
      };

      return { success: true, file: fileInfo };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }
);

ipcMain.handle("create-folder", async (_event, folderPath: string) => {
  try {
    // Check if folder already exists
    try {
      const stat = await fs.promises.stat(folderPath);
      if (stat.isDirectory()) {
        return { success: false, error: "Folder already exists" };
      } else {
        return {
          success: false,
          error: "A file with this name already exists",
        };
      }
    } catch {
      // Folder doesn't exist, which is what we want
    }

    // Create the folder
    await fs.promises.mkdir(folderPath, { recursive: true });

    // Get folder stats for return
    const stat = await fs.promises.stat(folderPath);
    const folderInfo = {
      id: folderPath,
      name: path.basename(folderPath),
      type: "folder" as const,
      modified: stat.mtime,
      path: folderPath,
    };

    return { success: true, folder: folderInfo };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle("delete-file", async (_event, filePath: string) => {
  try {
    const stat = await fs.promises.stat(filePath);

    if (stat.isDirectory()) {
      // Delete directory and all contents
      await fs.promises.rmdir(filePath, { recursive: true });
    } else {
      // Delete file
      await fs.promises.unlink(filePath);
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle(
  "rename-file",
  async (_event, oldPath: string, newPath: string) => {
    try {
      // Check if destination already exists
      try {
        await fs.promises.access(newPath);
        return {
          success: false,
          error: "A file or folder with this name already exists",
        };
      } catch {
        // Destination doesn't exist, which is what we want
      }

      // Rename/move the file
      await fs.promises.rename(oldPath, newPath);

      // Get updated file stats
      const stat = await fs.promises.stat(newPath);
      const isDirectory = stat.isDirectory();
      const fileInfo = {
        id: newPath,
        name: path.basename(newPath),
        type: isDirectory ? ("folder" as const) : ("file" as const),
        size: isDirectory ? undefined : stat.size,
        modified: stat.mtime,
        path: newPath,
      };

      return { success: true, file: fileInfo };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }
);

ipcMain.handle("check-path-exists", async (_event, filePath: string) => {
  try {
    await fs.promises.access(filePath);
    return { exists: true };
  } catch {
    return { exists: false };
  }
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
