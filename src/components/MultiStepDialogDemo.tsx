import React, { useState } from "react";
import {
  Settings,
  User,
  Mail,
  Key,
  Shield,
  Database,
  Palette,
} from "lucide-react";
import MultiStepDialog from "./MultiStepDialog";
import { Button } from "./ui/button";

const MultiStepDialogDemo = () => {
  const [demoDialog, setDemoDialog] = useState<{
    open: boolean;
    type: "user-profile" | "database-config" | "app-settings";
  } | null>(null);

  const handleUserProfileComplete = (values: Record<string, string>) => {
    console.log("User Profile Created:", values);
    alert(
      `User profile created for ${values.firstName} ${values.lastName} (${values.email})`
    );
  };

  const handleDatabaseConfigComplete = (values: Record<string, string>) => {
    console.log("Database Configuration:", values);
    alert(
      `Database configured: ${values.host}:${values.port}/${values.database}`
    );
  };

  const handleAppSettingsComplete = (values: Record<string, string>) => {
    console.log("App Settings:", values);
    alert(
      `Settings saved: Theme: ${values.theme}, Language: ${values.language}`
    );
  };

  const getUserProfileSteps = () => [
    {
      id: "firstName",
      title: "First Name",
      description: "Enter your first name",
      placeholder: "Enter your first name...",
      value: "",
      required: true,
      icon: User,
      validation: (value: string) => {
        if (!value.trim()) return "First name is required";
        if (value.length < 2) return "First name must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value))
          return "First name can only contain letters";
        return null;
      },
    },
    {
      id: "lastName",
      title: "Last Name",
      description: "Enter your last name",
      placeholder: "Enter your last name...",
      value: "",
      required: true,
      icon: User,
      validation: (value: string) => {
        if (!value.trim()) return "Last name is required";
        if (value.length < 2) return "Last name must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value))
          return "Last name can only contain letters";
        return null;
      },
    },
    {
      id: "email",
      title: "Email Address",
      description: "Enter your email address",
      placeholder: "Enter your email...",
      value: "",
      required: true,
      icon: Mail,
      validation: (value: string) => {
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value))
          return "Please enter a valid email address";
        return null;
      },
    },
    {
      id: "password",
      title: "Password",
      description: "Create a secure password",
      placeholder: "Enter your password...",
      value: "",
      required: true,
      icon: Key,
      validation: (value: string) => {
        if (!value.trim()) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/(?=.*[a-z])/.test(value))
          return "Password must contain at least one lowercase letter";
        if (!/(?=.*[A-Z])/.test(value))
          return "Password must contain at least one uppercase letter";
        if (!/(?=.*\d)/.test(value))
          return "Password must contain at least one number";
        return null;
      },
    },
    {
      id: "confirmPassword",
      title: "Confirm Password",
      description: "Confirm your password",
      placeholder: "Confirm your password...",
      value: "",
      required: true,
      icon: Shield,
      validation: (value: string, values?: Record<string, string>) => {
        if (!value.trim()) return "Password confirmation is required";
        if (value !== values?.password) return "Passwords do not match";
        return null;
      },
    },
  ];

  const getDatabaseConfigSteps = () => [
    {
      id: "host",
      title: "Database Host",
      description: "Enter the database hostname or IP address",
      placeholder: "localhost or 192.168.1.100...",
      value: "localhost",
      required: true,
      icon: Database,
      validation: (value: string) => {
        if (!value.trim()) return "Host is required";
        // Basic hostname/IP validation
        const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
        if (!hostnameRegex.test(value)) return "Invalid hostname format";
        return null;
      },
    },
    {
      id: "port",
      title: "Database Port",
      description: "Enter the database port number",
      placeholder: "5432, 3306, 1433...",
      value: "5432",
      required: true,
      icon: Database,
      validation: (value: string) => {
        if (!value.trim()) return "Port is required";
        const port = parseInt(value);
        if (isNaN(port) || port < 1 || port > 65535) {
          return "Port must be a number between 1 and 65535";
        }
        return null;
      },
    },
    {
      id: "database",
      title: "Database Name",
      description: "Enter the name of the database",
      placeholder: "myapp_production...",
      value: "",
      required: true,
      icon: Database,
      validation: (value: string) => {
        if (!value.trim()) return "Database name is required";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return "Database name can only contain letters, numbers, and underscores";
        }
        return null;
      },
    },
    {
      id: "username",
      title: "Username",
      description: "Enter the database username",
      placeholder: "Enter username...",
      value: "",
      required: true,
      icon: User,
      validation: (value: string) => {
        if (!value.trim()) return "Username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
        return null;
      },
    },
    {
      id: "password",
      title: "Password",
      description: "Enter the database password",
      placeholder: "Enter password...",
      value: "",
      required: true,
      icon: Key,
      validation: (value: string) => {
        if (!value.trim()) return "Password is required";
        return null;
      },
    },
  ];

  const getAppSettingsSteps = () => [
    {
      id: "theme",
      title: "Theme Preference",
      description: "Choose your preferred theme",
      placeholder: "light, dark, auto...",
      value: "auto",
      required: true,
      icon: Palette,
      validation: (value: string) => {
        if (!value.trim()) return "Theme is required";
        if (!["light", "dark", "auto"].includes(value.toLowerCase())) {
          return "Theme must be 'light', 'dark', or 'auto'";
        }
        return null;
      },
    },
    {
      id: "language",
      title: "Language",
      description: "Choose your preferred language",
      placeholder: "en, es, fr, de...",
      value: "en",
      required: true,
      icon: Settings,
      validation: (value: string) => {
        if (!value.trim()) return "Language is required";
        if (value.length !== 2)
          return "Language code must be 2 characters (e.g., 'en', 'es')";
        return null;
      },
    },
    {
      id: "notifications",
      title: "Email Notifications",
      description: "Enable email notifications?",
      placeholder: "yes, no...",
      value: "yes",
      required: true,
      icon: Mail,
      validation: (value: string) => {
        if (!value.trim()) return "This field is required";
        if (!["yes", "no"].includes(value.toLowerCase())) {
          return "Please enter 'yes' or 'no'";
        }
        return null;
      },
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Multi-Step Dialog Examples
      </h2>

      <p className="text-neutral-600 dark:text-neutral-400">
        These examples demonstrate the power and flexibility of the multi-step
        dialog component with different validation rules, step icons, and
        complex workflows.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => setDemoDialog({ open: true, type: "user-profile" })}
          className="h-24 flex flex-col items-center justify-center space-y-2"
        >
          <User className="w-6 h-6" />
          <span>User Profile Setup</span>
          <span className="text-xs opacity-70">5 steps with validation</span>
        </Button>

        <Button
          onClick={() => setDemoDialog({ open: true, type: "database-config" })}
          className="h-24 flex flex-col items-center justify-center space-y-2"
        >
          <Database className="w-6 h-6" />
          <span>Database Configuration</span>
          <span className="text-xs opacity-70">
            5 steps with custom validation
          </span>
        </Button>

        <Button
          onClick={() => setDemoDialog({ open: true, type: "app-settings" })}
          className="h-24 flex flex-col items-center justify-center space-y-2"
        >
          <Settings className="w-6 h-6" />
          <span>App Settings</span>
          <span className="text-xs opacity-70">3 steps with choices</span>
        </Button>
      </div>

      {/* User Profile Dialog */}
      {demoDialog?.type === "user-profile" && (
        <MultiStepDialog
          open={demoDialog.open}
          onOpenChange={(open) => setDemoDialog(open ? demoDialog : null)}
          title="Create User Profile"
          steps={getUserProfileSteps()}
          onComplete={handleUserProfileComplete}
        />
      )}

      {/* Database Config Dialog */}
      {demoDialog?.type === "database-config" && (
        <MultiStepDialog
          open={demoDialog.open}
          onOpenChange={(open) => setDemoDialog(open ? demoDialog : null)}
          title="Configure Database Connection"
          steps={getDatabaseConfigSteps()}
          onComplete={handleDatabaseConfigComplete}
        />
      )}

      {/* App Settings Dialog */}
      {demoDialog?.type === "app-settings" && (
        <MultiStepDialog
          open={demoDialog.open}
          onOpenChange={(open) => setDemoDialog(open ? demoDialog : null)}
          title="Application Settings"
          steps={getAppSettingsSteps()}
          onComplete={handleAppSettingsComplete}
        />
      )}
    </div>
  );
};

export default MultiStepDialogDemo;
