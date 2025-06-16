import { useAtom } from "jotai";
import {
  Home,
  Monitor,
  FileText,
  Download,
  Image,
  Video,
  Settings,
  Star,
  Cloud,
} from "lucide-react";
import {
  sidebarCollapsedAtom,
  currentPathAtom,
  pinnedFoldersAtom,
  cloudProvidersAtom,
} from "@/store/atoms";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const [collapsed] = useAtom(sidebarCollapsedAtom);
  const [currentPath, setCurrentPath] = useAtom(currentPathAtom);
  const [pinnedFolders] = useAtom(pinnedFoldersAtom);
  const [cloudProviders] = useAtom(cloudProvidersAtom);

  // Dynamically generate quick access items based on the user's home directory
  const homeBase = currentPath.split("/").slice(0, 3).join("/"); // e.g. /home/unnikrishnan
  const quickAccessItems = [
    { name: "Home", path: homeBase, icon: Home, color: "text-blue-500" },
    {
      name: "Desktop",
      path: `${homeBase}/Desktop`,
      icon: Monitor,
      color: "text-purple-500",
    },
    {
      name: "Documents",
      path: `${homeBase}/Documents`,
      icon: FileText,
      color: "text-green-500",
    },
    {
      name: "Downloads",
      path: `${homeBase}/Downloads`,
      icon: Download,
      color: "text-orange-500",
    },
    {
      name: "Pictures",
      path: `${homeBase}/Pictures`,
      icon: Image,
      color: "text-rose-500",
    },
    {
      name: "Videos",
      path: `${homeBase}/Videos`,
      icon: Video,
      color: "text-indigo-500",
    },
  ];

  const handlePathChange = (path: string) => {
    setCurrentPath(path);
  };

  const SidebarButton = ({
    icon: Icon,
    label,
    path,
    isActive = false,
    connected = true,
    color = "text-neutral-500",
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    label: string;
    path: string;
    isActive?: boolean;
    connected?: boolean;
    color?: string;
  }) => (
    <button
      onClick={() => handlePathChange(path)}
      className={cn(
        "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
        isActive
          ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-200",
        !connected && "opacity-60"
      )}
    >
      <Icon
        className={cn(
          "w-4 h-4 transition-colors",
          collapsed && "mx-auto",
          isActive ? "text-neutral-800 dark:text-neutral-200" : color
        )}
      />
      {!collapsed && (
        <>
          <span className="truncate font-medium flex-1 text-left">{label}</span>
          {!connected && (
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
          )}
        </>
      )}
    </button>
  );

  const resolvedPinnedFolders = pinnedFolders.map((folder) =>
    folder.replace("/home/user", homeBase)
  );

  return (
    <div
      className={cn(
        "bg-neutral-100 dark:bg-black border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {/* Quick Access */}
        <div className="px-3">
          {!collapsed && (
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3 px-2">
              Quick Access
            </h3>
          )}
          <div className="space-y-1">
            {quickAccessItems.map((item) => (
              <SidebarButton
                key={item.path}
                icon={item.icon}
                label={item.name}
                path={item.path}
                isActive={currentPath === item.path}
                color={item.color}
              />
            ))}
          </div>
        </div>

        {/* Pinned Folders */}
        <div className="px-3">
          {!collapsed && (
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3 px-2">
              Pinned
            </h3>
          )}
          <div className="space-y-1">
            {resolvedPinnedFolders.map((folder, index) => (
              <SidebarButton
                key={index}
                icon={Star}
                label={folder.split("/").pop() || folder}
                path={folder}
                isActive={currentPath === folder}
                color="text-yellow-500"
              />
            ))}
          </div>
        </div>

        {/* Cloud Storage */}
        <div className="px-3">
          {!collapsed && (
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3 px-2">
              Cloud Storage
            </h3>
          )}
          <div className="space-y-1">
            {cloudProviders.map((provider) => (
              <SidebarButton
                key={provider.id}
                icon={Cloud}
                label={provider.name}
                path={`/cloud/${provider.type}`}
                isActive={currentPath.startsWith(`/cloud/${provider.type}`)}
                connected={provider.connected}
                color="text-cyan-500"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <SidebarButton
          icon={Settings}
          label="Settings"
          path="/settings"
          isActive={currentPath === "/settings"}
          color="text-neutral-500"
        />
      </div>
    </div>
  );
};

export default Sidebar;
