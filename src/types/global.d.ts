export interface TerminalAPI {
  create: () => Promise<string>;
  destroy: () => Promise<string>;
  sendInput: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  onOutput: (callback: (data: string) => void) => void;
  offOutput: (callback: (data: string) => void) => void;
}

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  modified: Date;
  path: string;
  icon?: string;
}

export interface ElectronAPI {
  listDirectory: (
    dirPath: string
  ) => Promise<{ success: boolean; files?: FileItem[]; error?: string }>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getHomeDir: () => Promise<string>;
  openFile: (filePath: string) => Promise<unknown>;
  terminal: TerminalAPI;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
