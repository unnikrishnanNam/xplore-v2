import React, { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import TitleBar from "../components/TitleBar";
import Sidebar from "../components/Sidebar";
import FileExplorer from "../components/FileExplorer";
import Terminal from "../components/Terminal";
import CommandPalette from "../components/CommandPalette";
import {
  terminalOpenAtom,
  commandPaletteOpenAtom,
  themeAtom,
  updateHomeAtoms,
} from "../store/atoms";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";

const Index = () => {
  const [terminalOpen, setTerminalOpen] = useAtom(terminalOpenAtom);
  const [, setCommandPaletteOpen] = useAtom(commandPaletteOpenAtom);
  const [theme] = useAtom(themeAtom);
  const setUpdateHome = useSetAtom(updateHomeAtoms);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTerminalOpen, setCommandPaletteOpen]);

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
    </div>
  );
};

export default Index;
