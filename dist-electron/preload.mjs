"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(
      channel,
      (event, ...args2) => listener(event, ...args2)
    );
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  listDirectory: (dirPath) => electron.ipcRenderer.invoke("list-directory", dirPath),
  minimize: () => electron.ipcRenderer.send("window-minimize"),
  maximize: () => electron.ipcRenderer.send("window-maximize"),
  close: () => electron.ipcRenderer.send("window-close"),
  getHomeDir: () => electron.ipcRenderer.invoke("get-home-dir"),
  openFile: (filePath) => electron.ipcRenderer.invoke("open-file", filePath),
  // File operations
  createFile: (filePath, content) => electron.ipcRenderer.invoke("create-file", filePath, content),
  createFolder: (folderPath) => electron.ipcRenderer.invoke("create-folder", folderPath),
  deleteFile: (filePath) => electron.ipcRenderer.invoke("delete-file", filePath),
  renameFile: (oldPath, newPath) => electron.ipcRenderer.invoke("rename-file", oldPath, newPath),
  checkPathExists: (filePath) => electron.ipcRenderer.invoke("check-path-exists", filePath),
  // Terminal API
  terminal: {
    create: () => electron.ipcRenderer.invoke("terminal:create"),
    destroy: () => electron.ipcRenderer.invoke("terminal:destroy"),
    sendInput: (data) => electron.ipcRenderer.send("terminal:input", data),
    resize: (cols, rows) => electron.ipcRenderer.send("terminal:resize", cols, rows),
    onOutput: (callback) => {
      electron.ipcRenderer.on("terminal:output", (_event, data) => callback(data));
    },
    offOutput: (callback) => {
      electron.ipcRenderer.off("terminal:output", (_event, data) => callback(data));
    }
  }
});
