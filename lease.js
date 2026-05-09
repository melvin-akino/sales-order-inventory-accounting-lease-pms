// lease.js — equipment lease + PMS data and helpers.

// Assets — physical equipment that can be leased
const ASSETS = [
  { id: "AST-1041", model: "VitalSign VS-2200 Patient Monitor", serial: "VS22-A1041", category: "Patient Monitor", commissioned: "2026-01-15" },
  { id: "AST-1042", model: "VitalSign VS-2200 Patient Monitor", serial: "VS22-A1042", category: "Patient Monitor", commissioned: "2026-01-15" },
  { id: "AST-1043", model: "VitalSign VS-2200 Patient Monitor", serial: "VS22-A1043", category: "Patient Monitor", commissioned: "2026-01-15" },
  { id: "AST-2210", model: "BreathLine V-450 Ventilator",       serial: "BL45-2210",  category: "Ventilator",       commissioned: "2026-02-08" },
  { id: "AST-2211", model: "BreathLine V-450 Ventilator",       serial: "BL45-2211",  category: "Ventilator",       commissioned: "2026-02-08" },
  { id: "AST-3301", model: "FlowMate IP-100 Infusion Pump",     serial: "FM10-3301",  category: "Infusion Pump",    commissioned: "2026-02-22" },
  { id: "AST-3302", model: "FlowMate IP-100 Infusion Pump",     serial: "FM10-3302",  category: "Infusion Pump",    commissioned: "2026-02-22" },
  { id: "AST-3303", model: "FlowMate IP-100 Infusion Pump",     serial: "FM10-3303",  category: "Infusion Pump",    commissioned: "2026-02-22" },
  { id: "AST-3304", model: "FlowMate IP-100 Infusion Pump",     serial: "FM10-3304",  category: "Infusion Pump",    commissioned: "2026-02-22" },
  { id: "AST-4400", model: "OxyCore O-30 Oxygen Concentrator",  serial: "OC30-4400",  category: "Oxygen Concentrator", commissioned: "2026-03-12" },
  { id: "AST-5500", model: "DefibPro D-9 Cardiac Defibrillator",serial: "DF09-5500",  category: "Defibrillator",   commissioned: "2026-03-30" },
];

const TECHNICIANS = [
  { id: "T-01", name: "Renato Magbanua",   region: "NCR",  active: true },
  { id: "T-02", name: "Karina dela Peña",  region: "NCR",  active: true },
  { id: "T-03", name: "Andres Sebastian",  region: "VIS",  active: true },
  { id: "T-04", name: "Lourdes Pacheco",   region: "MIN",  active: false },
];

const LEASES = [
  {
    id: "LSE-2026-014",
    customerId: "C-1042", // St. Luke's QC
    startDate: "2026-01-15",
    termMonths: 24,
    monthlyFee: 56500,
    maintenanceMonths: 3,           // quarterly PM
    assetIds: ["AST-1041", "AST-1042", "AST-1043"],
    contractRef: "CTR-SLMC-26-014",
  },
  {
    id: "LSE-2026-021",
    customerId: "C-1187", // Makati Medical
    startDate: "2026-02-08",
    termMonths: 36,
    monthlyFee: 92000,
    maintenanceMonths: 2,           // bi-monthly PM (critical care)
    assetIds: ["AST-2210", "AST-2211"],
    contractRef: "CTR-MMC-26-021",
  },
  {
    id: "LSE-2026-029",
    customerId: "C-1203", // The Medical City
    startDate: "2026-02-22",
    termMonths: 18,
    monthlyFee: 38000,
    maintenanceMonths: 6,           // semi-annual PM
    assetIds: ["AST-3301", "AST-3302", "AST-3303", "AST-3304"],
    contractRef: "CTR-TMC-26-029",
  },
  {
    id: "LSE-2026-035",
    customerId: "C-1455", // Asian Hospital
    startDate: "2026-03-12",
    termMonths: 12,
    monthlyFee: 14500,
    maintenanceMonths: 3,
    assetIds: ["AST-4400"],
    contractRef: "CTR-AHMC-26-035",
  },
  {
    id: "LSE-2026-042",
    customerId: "C-1318", // Cebu Doctors
    startDate: "2026-03-30",
    termMonths: 24,
    monthlyFee: 42000,
    maintenanceMonths: 3,
    assetIds: ["AST-5500"],
    contractRef: "CTR-CDUH-26-042",
  },
];

// PMS task templates by category
const PMS_TASKS = {
  "Patient Monitor": "Quarterly PM: calibrate BP module · verify SpO₂ accuracy · inspect ECG cables and gel sensor pads · run self-test · clean fan filters.",
  "Ventilator": "Bi-monthly PM: replace inspiratory/expiratory filters · check valve integrity · calibrate flow & pressure transducers · verify O₂ sensor · battery load test.",
  "Infusion Pump": "Semi-annual PM: occlusion test · accuracy check at 1, 25, 250 mL/hr · battery cycle · replace door gasket if worn.",
  "Oxygen Concentrator": "Quarterly PM: O₂ purity check (>90%) · sieve bed inspection · replace inlet & cabinet filters · audit hours-meter.",
  "Defibrillator": "Quarterly PM: discharge test at 200J · battery capacity check · replace pads if expired · cable continuity · paper roll & gel.",
};

// Build the recurring work-order schedule for a lease.
// Generates one WO per asset per maintenance cycle, for the contract term.
// Each generated WO references its lease so the audit trail is clear.
function generateWorkOrders(leases) {
  const now = new Date("2026-05-09T09:00:00+08:00");
  const orders = [];
  let counter = 1820;

  for (const lease of leases) {
    const start = new Date(lease.startDate);
    const cycles = Math.floor(lease.termMonths / lease.maintenanceMonths);
    for (let cycle = 1; cycle <= cycles; cycle++) {
      const due = new Date(start);
      due.setMonth(due.getMonth() + cycle * lease.maintenanceMonths);
      for (const assetId of lease.assetIds) {
        const asset = ASSETS.find((a) => a.id === assetId);
        const past = due < now;
        // Auto-mark past cycles as completed; future ones pending
        const status = past ? "COMPLETED" : "PENDING";
        const wo = {
          id: "WO-2026-" + String(counter++).padStart(4, "0"),
          leaseId: lease.id,
          assetId,
          customerId: lease.customerId,
          scheduledFor: due.toISOString().slice(0, 10),
          status,
          technicianId: past ? (cycle % 2 ? "T-01" : "T-02") : null,
          taskDetails: PMS_TASKS[asset.category] || "Routine preventive maintenance.",
          priority: "NORMAL",
          techNotes: past ? [
            { by: cycle % 2 ? "Renato Magbanua" : "Karina dela Peña", at: due.toISOString(), text: "All checks passed. Returned to service." },
          ] : [],
          completedAt: past ? due.toISOString() : null,
        };
        orders.push(wo);
      }
    }
  }
  // Layer in some current-day variety — give us active board content
  const today = "2026-05-09";
  const tomorrow = "2026-05-10";
  const yesterday = "2026-05-08";

  // Move some pending into IN_PROGRESS / NEEDS_PARTS / today's queue
  let activeBucket = orders.filter((w) => w.status === "PENDING")
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

  // Schedule the next 8 onto today/tomorrow with varied statuses
  if (activeBucket.length >= 8) {
    activeBucket[0].scheduledFor = yesterday;
    activeBucket[0].status = "IN_PROGRESS";
    activeBucket[0].technicianId = "T-01";
    activeBucket[0].priority = "URGENT";
    activeBucket[0].techNotes = [{ by: "Renato Magbanua", at: yesterday + "T08:30:00+08:00", text: "Started calibration. ECG cable shows intermittent fault." }];

    activeBucket[1].scheduledFor = today;
    activeBucket[1].status = "NEEDS_PARTS";
    activeBucket[1].technicianId = "T-02";
    activeBucket[1].priority = "URGENT";
    activeBucket[1].techNotes = [{ by: "Karina dela Peña", at: today + "T07:15:00+08:00", text: "Inspiratory filter housing cracked. Need PN BL-450-FH-02. Awaiting parts from MNL DC." }];

    activeBucket[2].scheduledFor = today;
    activeBucket[2].status = "IN_PROGRESS";
    activeBucket[2].technicianId = "T-01";
    activeBucket[2].techNotes = [{ by: "Renato Magbanua", at: today + "T08:50:00+08:00", text: "On site. Beginning quarterly checks." }];

    activeBucket[3].scheduledFor = today;
    activeBucket[3].status = "PENDING";

    activeBucket[4].scheduledFor = today;
    activeBucket[4].status = "PENDING";

    activeBucket[5].scheduledFor = tomorrow;
    activeBucket[5].status = "PENDING";

    activeBucket[6].scheduledFor = tomorrow;
    activeBucket[6].status = "PENDING";

    activeBucket[7].scheduledFor = today;
    activeBucket[7].status = "COMPLETED";
    activeBucket[7].technicianId = "T-02";
    activeBucket[7].completedAt = today + "T11:20:00+08:00";
    activeBucket[7].techNotes = [{ by: "Karina dela Peña", at: today + "T11:20:00+08:00", text: "Calibration within spec. Returned to service." }];
  }

  return orders;
}

const WORK_ORDERS = generateWorkOrders(LEASES);

const WO_STATUS = ["PENDING", "IN_PROGRESS", "NEEDS_PARTS", "COMPLETED"];
const WO_LABEL = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  NEEDS_PARTS: "Needs parts",
  COMPLETED: "Completed",
};
const WO_NEXT = {
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["NEEDS_PARTS", "COMPLETED"],
  NEEDS_PARTS: ["IN_PROGRESS", "COMPLETED"],
  COMPLETED: [],
};

const assetById      = (id) => ASSETS.find((a) => a.id === id);
const technicianById = (id) => TECHNICIANS.find((t) => t.id === id);
const leaseById      = (id) => LEASES.find((l) => l.id === id);

Object.assign(window, {
  ASSETS, TECHNICIANS, LEASES, WORK_ORDERS,
  WO_STATUS, WO_LABEL, WO_NEXT, PMS_TASKS,
  assetById, technicianById, leaseById, generateWorkOrders,
});
