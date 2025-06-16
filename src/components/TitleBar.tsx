import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Minus, Square, X, Moon, Sun } from "lucide-react";
import { themeAtom } from "@/store/atoms";

const TitleBar = () => {
  const [os, setOs] = useState<"windows" | "macos" | "linux">("linux");
  const [theme, setTheme] = useAtom(themeAtom);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("mac")) {
      setOs("macos");
    } else if (userAgent.includes("win")) {
      setOs("windows");
    } else {
      setOs("linux");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Window control handlers
  const handleMinimize = () => {
    // @ts-expect-error: electronAPI is injected by Electron preload
    window.electronAPI?.minimize?.();
  };
  const handleMaximize = () => {
    // @ts-expect-error: electronAPI is injected by Electron preload
    window.electronAPI?.maximize?.();
  };
  const handleClose = () => {
    // @ts-expect-error: electronAPI is injected by Electron preload
    window.electronAPI?.close?.();
  };

  const MacOSControls = () => (
    <div className="flex items-center space-x-2 ml-4">
      <div
        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer transition-colors"
        onClick={handleClose}
      ></div>
      <div
        className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer transition-colors"
        onClick={handleMinimize}
      ></div>
      <div
        className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 cursor-pointer transition-colors"
        onClick={handleMaximize}
      ></div>
    </div>
  );

  const WindowsLinuxControls = () => (
    <div className="flex items-center">
      <button
        className="p-3 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        onClick={handleMinimize}
      >
        <Minus className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
      </button>
      <button
        className="p-3 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        onClick={handleMaximize}
      >
        <Square className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
      </button>
      <button
        className="p-3 hover:bg-red-500 hover:text-white transition-colors text-neutral-600"
        onClick={handleClose}
      >
        <X className="w-4 h-4 dark:text-neutral-300" />
      </button>
    </div>
  );

  return (
    <div className="h-12 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between select-none drag">
      {/* Only the control buttons should not be draggable */}
      <div className="no-drag">{os === "macos" ? <MacOSControls /> : null}</div>
      <div className="flex-1 text-left px-6">
        <h1 className="text-lg font-bold text-neutral-700 dark:text-neutral-200">
          Xplore
        </h1>
      </div>
      <div className="mr-4 flex items-center no-drag">
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4 text-neutral-600" />
          ) : (
            <Sun className="w-4 h-4 text-yellow-500" />
          )}
        </button>
        {os !== "macos" ? <WindowsLinuxControls /> : null}
      </div>
    </div>
  );
};

export default TitleBar;
