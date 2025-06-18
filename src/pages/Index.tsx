import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import TitleBar from "../components/TitleBar";
import Sidebar from "../components/Sidebar";
import FileExplorer from "../components/FileExplorer";
import Terminal from "../components/Terminal";
import CommandPalette from "../components/CommandPalette";
import MultiStepDialogDemo from "../components/MultiStepDialogDemo";
import {
  terminalOpenAtom,
  commandPaletteOpenAtom,
  themeAtom,
  updateHomeAtoms,
  demoModeAtom,
} from "../store/atoms";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";

const Index = () => {
  const [terminalOpen, setTerminalOpen] = useAtom(terminalOpenAtom);
  const [, setCommandPaletteOpen] = useAtom(commandPaletteOpenAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const setUpdateHome = useSetAtom(updateHomeAtoms);
  const [showDemo, setShowDemo] = useAtom(demoModeAtom);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Listen for system theme changes and update themeAtom
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setTheme(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [setTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Terminal toggle: Ctrl+Shift+` (backtick)
      if (e.ctrlKey && e.shiftKey && e.code === "Backquote") {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      }

      // Command palette toggle: Ctrl+Shift+P
      if (e.ctrlKey && e.shiftKey && e.code === "KeyP") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }

      // Demo mode toggle: Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.code === "KeyD") {
        e.preventDefault();
        setShowDemo((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTerminalOpen, setCommandPaletteOpen, setShowDemo]);

  useEffect(() => {
    setUpdateHome();
  }, [setUpdateHome]);

  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-white dark:from-black dark:to-neutral-950 flex flex-col overflow-hidden">
      <TitleBar />
      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={terminalOpen ? 70 : 100} minSize={30}>
          <div className="flex h-full overflow-hidden">
            <Sidebar />
            <FileExplorer />
          </div>
        </ResizablePanel>
        {terminalOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={70}>
              <Terminal />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      <CommandPalette />

      {/* Demo Mode Overlay */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto m-4">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Multi-Step Dialog Demonstrations
              </h2>
              <button
                onClick={() => setShowDemo(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <MultiStepDialogDemo />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
