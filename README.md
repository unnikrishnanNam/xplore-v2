# XPlore - Modern File Explorer

A modern, feature-rich file explorer built with Electron, React, TypeScript, and Vite.

## Features

### 🗂️ File Management

- **Modern File Explorer** - Browse files and folders with grid/list views
- **Multi-Step File Creation** - Enhanced file/folder creation with step-by-step workflow
- **Context Menus** - Right-click context menus for file operations
- **File Operations** - Copy, cut, paste, rename, delete operations

### 🎨 User Interface

- **Dark/Light Theme** - Automatic theme detection with manual toggle
- **Command Palette** - Quick access to all features (Ctrl+Shift+P)
- **Resizable Panels** - Adjustable sidebar and terminal panels
- **Modern UI Components** - Built with shadcn/ui components

### 💻 Terminal Integration

- **Integrated Terminal** - Full xterm.js terminal with proper shell integration
- **Theme-Aware** - Terminal colors adapt to dark/light mode
- **Auto-Scroll** - Automatically scrolls to show new content
- **Dynamic Resizing** - Terminal resizes with panel dimensions

### 🔧 Advanced Features

- **Multi-Step Dialogs** - Reusable dialog component for complex user inputs
- **State Management** - Jotai-based reactive state management
- **Keyboard Shortcuts** - Comprehensive keyboard navigation
- **File Sorting** - Sort by name, size, or modification date

## Recent Updates

### Multi-Step Dialog System

- **Enhanced File Creation**: Two-step process for files (name + extension), single-step for folders
- **Command Palette Integration**: Create files directly from command palette
- **Validation System**: Real-time validation with custom error messages
- **Keyboard Navigation**: Full keyboard support with shortcuts
- **Modern Design**: Command palette-inspired UI

## Development

This project uses React + TypeScript + Vite for the frontend and Electron for the desktop application.

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Desktop**: Electron
- **UI Components**: shadcn/ui, Tailwind CSS
- **State Management**: Jotai
- **Terminal**: xterm.js with node-pty
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── MultiStepDialog.tsx  # Reusable multi-step dialog
│   ├── CommandPalette.tsx   # Command palette interface
│   └── FileExplorer.tsx     # Main file explorer
├── store/              # State management (Jotai)
├── hooks/              # Custom React hooks
└── pages/              # Page components
```
