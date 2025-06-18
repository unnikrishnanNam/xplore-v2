#!/usr/bin/env node

const express = require("express");
const cors = require("cors");
const app = express();
const port = 8080;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Mock VM data
let vms = [
  {
    name: "Test-VM-1",
    status: "running",
    ip: "192.168.122.194",
  },
  {
    name: "Test-VM-2",
    status: "running",
    ip: "192.168.122.143",
  },
  {
    name: "Test-VM-3",
    status: "shut off",
    ip: "unavailable",
  },
];

// GET /vm - List all VMs
app.get("/vm", (req, res) => {
  console.log("GET /vm - Returning VMs list");
  res.json(vms);
});

// POST /vm/provision - Provision new VM
app.post("/vm/provision", (req, res) => {
  const { name, baseImage, cpu, memory, disk, sshKey, sshPass } = req.body;
  console.log("POST /vm/provision", req.body);

  // Add VM with provisioning status
  vms.push({
    name,
    status: "provisioning",
    ip: "unavailable",
  });

  // Simulate provisioning process
  setTimeout(() => {
    const vmIndex = vms.findIndex((vm) => vm.name === name);
    if (vmIndex !== -1) {
      vms[vmIndex] = {
        name,
        status: "running",
        ip: `192.168.122.${Math.floor(Math.random() * 200) + 50}`,
      };
    }
  }, 10000); // Provision after 10 seconds

  res.send("Provision request submitted!");
});

// GET /vm/status/:name - Get VM status
app.get("/vm/status/:name", (req, res) => {
  const vmName = req.params.name;
  const vm = vms.find((v) => v.name === vmName);

  if (!vm) {
    return res.status(404).json({ error: "VM not found" });
  }

  console.log(`GET /vm/status/${vmName}`, vm);

  res.json({
    status: "success",
    name: vm.name,
    state: vm.status === "shut off" ? "shut_off" : vm.status,
    ip: vm.ip,
  });
});

// POST /vm/delete - Delete VM
app.post("/vm/delete", (req, res) => {
  const { vmName } = req.body;
  console.log("POST /vm/delete", { vmName });

  const vmIndex = vms.findIndex((vm) => vm.name === vmName);
  if (vmIndex !== -1) {
    vms[vmIndex].status = "deleting";

    // Simulate deletion after 5 seconds
    setTimeout(() => {
      const deleteIndex = vms.findIndex((vm) => vm.name === vmName);
      if (deleteIndex !== -1) {
        vms.splice(deleteIndex, 1);
      }
    }, 5000);
  }

  res.send(`🗑️ Delete request for VM '${vmName}' submitted.`);
});

// POST /vm/start/:name - Start VM
app.post("/vm/start/:name", (req, res) => {
  const vmName = req.params.name;
  const vm = vms.find((v) => v.name === vmName);

  if (!vm) {
    return res.status(404).json({ error: "VM not found" });
  }

  console.log(`POST /vm/start/${vmName}`);

  if (vm.status === "shut off") {
    vm.status = "running";
    vm.ip = `192.168.122.${Math.floor(Math.random() * 200) + 50}`;

    setTimeout(() => {
      res.json({
        status: "success",
        message: `VM '${vmName}' started successfully`,
        ip: vm.ip,
      });
    }, 2000); // Simulate 2 second start time
  } else {
    res.json({
      status: "error",
      message: `VM '${vmName}' is already running or in transition`,
    });
  }
});

// POST /vm/shutdown/:name - Shutdown VM
app.post("/vm/shutdown/:name", (req, res) => {
  const vmName = req.params.name;
  const vm = vms.find((v) => v.name === vmName);

  if (!vm) {
    return res.status(404).json({ error: "VM not found" });
  }

  console.log(`POST /vm/shutdown/${vmName}`);

  if (vm.status === "running") {
    vm.status = "shut off";
    vm.ip = "unavailable";

    setTimeout(() => {
      res.json({
        status: "success",
        message: `VM '${vmName}' shut down successfully`,
      });
    }, 2000); // Simulate 2 second shutdown time
  } else {
    res.json({
      status: "error",
      message: `VM '${vmName}' is not running`,
    });
  }
});

app.listen(port, () => {
  console.log(`Mock VM Service running at http://localhost:${port}`);
  console.log("Available endpoints:");
  console.log("  GET    /vm");
  console.log("  POST   /vm/provision");
  console.log("  GET    /vm/status/:name");
  console.log("  POST   /vm/delete");
  console.log("  POST   /vm/start/:name");
  console.log("  POST   /vm/shutdown/:name");
});
