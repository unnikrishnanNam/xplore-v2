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
ipcMain.handle(
  "create-file",
  async (_event, filePath, content = "") => {
    try {
      const directory = path.dirname(filePath);
      await fs.promises.mkdir(directory, { recursive: true });
      try {
        await fs.promises.access(filePath);
        return { success: false, error: "File already exists" };
      } catch {
      }
      await fs.promises.writeFile(filePath, content, "utf8");
      const stat = await fs.promises.stat(filePath);
      const fileInfo = {
        id: filePath,
        name: path.basename(filePath),
        type: "file",
        size: stat.size,
        modified: stat.mtime,
        path: filePath
      };
      return { success: true, file: fileInfo };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }
);
ipcMain.handle("create-folder", async (_event, folderPath) => {
  try {
    try {
      const stat2 = await fs.promises.stat(folderPath);
      if (stat2.isDirectory()) {
        return { success: false, error: "Folder already exists" };
      } else {
        return {
          success: false,
          error: "A file with this name already exists"
        };
      }
    } catch {
    }
    await fs.promises.mkdir(folderPath, { recursive: true });
    const stat = await fs.promises.stat(folderPath);
    const folderInfo = {
      id: folderPath,
      name: path.basename(folderPath),
      type: "folder",
      modified: stat.mtime,
      path: folderPath
    };
    return { success: true, folder: folderInfo };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});
ipcMain.handle("delete-file", async (_event, filePath) => {
  try {
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      await fs.promises.rmdir(filePath, { recursive: true });
    } else {
      await fs.promises.unlink(filePath);
    }
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});
ipcMain.handle(
  "rename-file",
  async (_event, oldPath, newPath) => {
    try {
      try {
        await fs.promises.access(newPath);
        return {
          success: false,
          error: "A file or folder with this name already exists"
        };
      } catch {
      }
      await fs.promises.rename(oldPath, newPath);
      const stat = await fs.promises.stat(newPath);
      const isDirectory = stat.isDirectory();
      const fileInfo = {
        id: newPath,
        name: path.basename(newPath),
        type: isDirectory ? "folder" : "file",
        size: isDirectory ? void 0 : stat.size,
        modified: stat.mtime,
        path: newPath
      };
      return { success: true, file: fileInfo };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }
);
ipcMain.handle("check-path-exists", async (_event, filePath) => {
  try {
    await fs.promises.access(filePath);
    return { exists: true };
  } catch {
    return { exists: false };
  }
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
ipcMain.handle(
  "connect-ssh",
  async (_event, credentials) => {
    console.log("SSH connection request received:", {
      vmName: credentials.vmName,
      vmIP: credentials.vmIP,
      username: credentials.username
    });
    try {
      if (shellPty) {
        console.log("Killing existing terminal process for SSH connection");
        shellPty.kill();
        shellPty = null;
      }
      const sshCommand = `sshpass -p '${credentials.password}' ssh -o StrictHostKeyChecking=no ${credentials.username}@${credentials.vmIP}`;
      console.log(
        "Creating SSH connection with command:",
        sshCommand.replace(credentials.password, "***")
      );
      shellPty = pty.spawn("bash", ["-c", sshCommand], {
        name: "xterm-color",
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env
      });
      shellPty.onData((data) => {
        if (win) {
          win.webContents.send("terminal:output", data);
        }
      });
      shellPty.onExit((exitCode) => {
        console.log("SSH terminal process exited with code:", exitCode);
        shellPty = null;
      });
      console.log("SSH connection established successfully");
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("SSH connection failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }
);
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
