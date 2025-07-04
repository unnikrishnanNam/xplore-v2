import { ipcRenderer, contextBridge } from "electron";

interface SSHCredentials {
  username: string;
  password: string;
  vmName: string;
  vmIP: string;
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

contextBridge.exposeInMainWorld("electronAPI", {
  listDirectory: (dirPath: string) =>
    ipcRenderer.invoke("list-directory", dirPath),
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  getHomeDir: () => ipcRenderer.invoke("get-home-dir"),
  openFile: (filePath: string) => ipcRenderer.invoke("open-file", filePath),

  // File operations
  createFile: (filePath: string, content?: string) =>
    ipcRenderer.invoke("create-file", filePath, content),
  createFolder: (folderPath: string) =>
    ipcRenderer.invoke("create-folder", folderPath),
  deleteFile: (filePath: string) => ipcRenderer.invoke("delete-file", filePath),
  renameFile: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke("rename-file", oldPath, newPath),
  checkPathExists: (filePath: string) =>
    ipcRenderer.invoke("check-path-exists", filePath),
  // SSH connection
  connectSSH: (credentials: SSHCredentials) =>
    ipcRenderer.invoke("connect-ssh", credentials),

  // Terminal API
  terminal: {
    create: () => ipcRenderer.invoke("terminal:create"),
    destroy: () => ipcRenderer.invoke("terminal:destroy"),
    sendInput: (data: string) => ipcRenderer.send("terminal:input", data),
    resize: (cols: number, rows: number) =>
      ipcRenderer.send("terminal:resize", cols, rows),
    onOutput: (callback: (data: string) => void) => {
      ipcRenderer.on("terminal:output", (_event, data) => callback(data));
    },
    offOutput: (callback: (data: string) => void) => {
      ipcRenderer.off("terminal:output", (_event, data) => callback(data));
    },
  },
});
