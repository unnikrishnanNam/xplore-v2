import { atom } from 'jotai';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: Date;
  path: string;
  icon?: string;
}

export interface CloudProvider {
  id: string;
  name: string;
  type: 'google-drive' | 'onedrive' | 'dropbox';
  connected: boolean;
}

// Theme atoms
export const themeAtom = atom<'light' | 'dark'>('dark');

// UI state atoms
export const sidebarCollapsedAtom = atom(false);
export const terminalOpenAtom = atom(false);
export const terminalMinimizedAtom = atom(false);
export const commandPaletteOpenAtom = atom(false);

// File system atoms
export const currentPathAtom = atom('/home/user');
export const selectedFilesAtom = atom<string[]>([]);
export const pinnedFoldersAtom = atom<string[]>([
  '/home/user/Projects',
  '/home/user/Documents/Important',
]);

// File view and sorting atoms
export const fileViewModeAtom = atom<'list' | 'grid'>('list');
export const fileSortModeAtom = atom<'name' | 'size' | 'modified'>('name');
export const fileSortOrderAtom = atom<'asc' | 'desc'>('asc');

// Cloud providers atom
export const cloudProvidersAtom = atom<CloudProvider[]>([
  { id: '1', name: 'Google Drive', type: 'google-drive', connected: true },
  { id: '2', name: 'OneDrive', type: 'onedrive', connected: false },
  { id: '3', name: 'Dropbox', type: 'dropbox', connected: true },
]);

// Sample file data
export const filesAtom = atom<FileItem[]>([
  { id: '1', name: 'package.json', type: 'file', size: 1024, modified: new Date(), path: '/home/user/package.json' },
  { id: '2', name: 'src', type: 'folder', modified: new Date(), path: '/home/user/src' },
  { id: '3', name: 'README.md', type: 'file', size: 2048, modified: new Date(), path: '/home/user/README.md' },
  { id: '4', name: 'components', type: 'folder', modified: new Date(), path: '/home/user/components' },
  { id: '5', name: 'index.ts', type: 'file', size: 512, modified: new Date(), path: '/home/user/index.ts' },
]);
