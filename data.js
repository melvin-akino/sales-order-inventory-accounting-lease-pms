// Seed data — realistic hospital consumables + equipment + sales orders.
// Currency: PHP. VAT 12%. CWT 2% (BIR Form 2307).

const PESO = (n) =>
  "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SHORT_PESO = (n) => {
  const v = Math.abs(n);
  if (v >= 1e6) return "₱" + (n / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return "₱" + Math.round(n / 1e3) + "K";
  return "₱" + Math.round(n);
};

const CATALOG = [
  // Consumables
  { sku: "CON-IV-018",  name: "IV Administration Set, 18-drop",   unit: "pc",  price: 78.00,   cat: "Consumable", stock: 1240 },
  { sku: "CON-SY-10",   name: "Disposable Syringe 10mL, Luer-lok",unit: "pc",  price: 14.50,   cat: "Consumable", stock: 8600 },
  { sku: "CON-SY-3",    name: "Disposable Syringe 3mL",           unit: "pc",  price: 6.25,    cat: "Consumable", stock: 12200 },
  { sku: "CON-GLV-M",   name: "Nitrile Exam Glove, Medium",       unit: "box", price: 365.00,  cat: "Consumable", stock: 320 },
  { sku: "CON-GLV-L",   name: "Nitrile Exam Glove, Large",        unit: "box", price: 365.00,  cat: "Consumable", stock: 180 },
  { sku: "CON-MSK-N95", name: "N95 Respirator, cup-style",        unit: "pc",  price: 38.00,   cat: "Consumable", stock: 4400 },
  { sku: "CON-GZE-4",   name: "Sterile Gauze Pad, 4×4 in",        unit: "pc",  price: 9.75,    cat: "Consumable", stock: 6800 },
  { sku: "CON-CTH-16",  name: "Foley Catheter, 16Fr",             unit: "pc",  price: 142.00,  cat: "Consumable", stock: 410 },
  { sku: "CON-BAG-1L",  name: "PNSS 0.9% Saline, 1L",             unit: "btl", price: 64.00,   cat: "Consumable", stock: 2200 },
  { sku: "CON-BAG-D5",  name: "D5W Dextrose, 1L",                 unit: "btl", price: 72.00,   cat: "Consumable", stock: 1840 },
  { sku: "CON-ALC-500", name: "Isopropyl Alcohol 70%, 500mL",     unit: "btl", price: 95.00,   cat: "Consumable", stock: 980 },
  { sku: "CON-LCT-22",  name: "IV Cannula 22G",                   unit: "pc",  price: 22.00,   cat: "Consumable", stock: 5400 },
  // Equipment / consumable accessories
  { sku: "EQP-MON-BP",  name: "Patient Monitor, BP cuff (adult)", unit: "pc",  price: 1850.00, cat: "Accessory",  stock: 64 },
  { sku: "EQP-OXM-FP",  name: "SpO₂ Sensor, finger probe",        unit: "pc",  price: 2200.00, cat: "Accessory",  stock: 38 },
  { sku: "EQP-NBL-KT",  name: "Nebulizer Mask Kit, adult",        unit: "kit", price: 285.00,  cat: "Accessory",  stock: 240 },
];

const CUSTOMERS = [
  { id: "C-1042", name: "St. Luke's Medical Center — QC",    contact: "Dr. M. Reyes",    region: "NCR",   city: "Quezon City",     terms: "Net 30", credit: 2500000 },
  { id: "C-1187", name: "Makati Medical Center",             contact: "Procurement Off.",region: "NCR",   city: "Makati",          terms: "Net 30", credit: 3000000 },
  { id: "C-1203", name: "The Medical City — Ortigas",        contact: "Ms. J. Domingo",  region: "NCR",   city: "Pasig",           terms: "Net 45", credit: 2200000 },
  { id: "C-1318", name: "Cebu Doctors' University Hospital", contact: "Mr. R. Tan",      region: "VII",   city: "Cebu City",       terms: "Net 30", credit: 1800000 },
  { id: "C-1402", name: "Davao Doctors Hospital",            contact: "Ms. A. Lim",      region: "XI",    city: "Davao City",      terms: "Net 30", credit: 1500000 },
  { id: "C-1455", name: "Asian Hospital and Medical Center", contact: "Dr. F. Cruz",     region: "NCR",   city: "Muntinlupa",      terms: "Net 30", credit: 2000000 },
  { id: "C-1501", name: "Baguio General Hospital",           contact: "Ms. P. Aquino",   region: "CAR",   city: "Baguio",          terms: "Net 60", credit: 900000 },
  { id: "C-1577", name: "Iloilo Mission Hospital",           contact: "Mr. K. Salazar",  region: "VI",    city: "Iloilo",          terms: "Net 30", credit: 800000 },
];

const AGENTS = [
  { id: "A-07", name: "Maria Santillan", region: "NCR" },
  { id: "A-12", name: "Joaquin Pereyra", region: "NCR" },
  { id: "A-21", name: "Pia Hernandez",   region: "VIS" },
  { id: "A-33", name: "Ramon Ocampo",    region: "MIN" },
];

const WAREHOUSES = [
  { id: "WH-MNL", name: "Manila — Pasig DC", code: "MNL" },
  { id: "WH-CEB", name: "Cebu DC",           code: "CEB" },
  { id: "WH-DVO", name: "Davao DC",          code: "DVO" },
];

const STATES = ["PENDING", "APPROVED", "PREPARING", "SHIPPED", "DELIVERED"];
const STATE_LABEL = {
  PENDING: "Pending Review",
  APPROVED: "Approved",
  PREPARING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// Helpers used to build seed orders.
function lineSub(line) { return line.qty * line.price; }
function orderSub(lines) { return lines.reduce((s, l) => s + lineSub(l), 0); }
function vatOf(sub, rate = 0.12) { return sub * rate; }
function cwtOf(sub, rate = 0.02, on = false) { return on ? sub * rate : 0; }
function totalOf(lines, withCwt = false) {
  const sub = orderSub(lines);
  return sub + vatOf(sub) - cwtOf(sub, 0.02, withCwt);
}

const seed = (sku, qty) => {
  const p = CATALOG.find((c) => c.sku === sku);
  return { sku: p.sku, name: p.name, unit: p.unit, price: p.price, qty };
};

// Each event: { state, at (ISO), by, note? }
const _now = new Date("2026-05-09T09:00:00+08:00");
const hoursAgo = (h) => new Date(_now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo  = (d) => new Date(_now.getTime() - d * 24 * 3600 * 1000).toISOString();

const ORDERS = [
  {
    id: "SO-2026-0418",
    customerId: "C-1042",
    agentId: "A-07",
    warehouseId: "WH-MNL",
    state: "PENDING",
    createdAt: hoursAgo(2.5),
    needBy: daysAgo(-3),
    cwt2307: true,
    poRef: "PO-SLMC-26-2241",
    lines: [
      seed("CON-IV-018", 200),
      seed("CON-SY-10", 1500),
      seed("CON-GLV-M", 24),
      seed("CON-BAG-1L", 80),
    ],
    timeline: [
      { state: "CREATED", at: hoursAgo(2.5), by: "Maria Santillan (A-07)", note: "Order placed via field tablet" },
    ],
  },
  {
    id: "SO-2026-0417",
    customerId: "C-1187",
    agentId: "A-07",
    warehouseId: "WH-MNL",
    state: "PENDING",
    createdAt: hoursAgo(4),
    needBy: daysAgo(-5),
    cwt2307: true,
    poRef: "PO-MMC-26-1108",
    lines: [
      seed("CON-MSK-N95", 800),
      seed("CON-GZE-4", 1200),
      seed("CON-ALC-500", 60),
    ],
    timeline: [
      { state: "CREATED", at: hoursAgo(4), by: "Maria Santillan (A-07)" },
    ],
  },
  {
    id: "SO-2026-0416",
    customerId: "C-1455",
    agentId: "A-12",
    warehouseId: "WH-MNL",
    state: "APPROVED",
    createdAt: hoursAgo(8),
    needBy: daysAgo(-2),
    cwt2307: true,
    poRef: "PO-AHMC-26-3340",
    lines: [
      seed("CON-CTH-16", 60),
      seed("CON-LCT-22", 400),
      seed("EQP-NBL-KT", 30),
    ],
    timeline: [
      { state: "CREATED",  at: hoursAgo(8),   by: "Joaquin Pereyra (A-12)" },
      { state: "APPROVED", at: hoursAgo(1.2), by: "F. Villanueva (Finance)", note: "Within credit limit. Approved." },
    ],
  },
  {
    id: "SO-2026-0415",
    customerId: "C-1203",
    agentId: "A-12",
    warehouseId: "WH-MNL",
    state: "PREPARING",
    createdAt: daysAgo(1),
    needBy: daysAgo(-1),
    cwt2307: true,
    poRef: "PO-TMC-26-0902",
    lines: [
      seed("CON-IV-018", 120),
      seed("CON-SY-3", 2000),
      seed("CON-GLV-L", 18),
      seed("CON-BAG-D5", 60),
    ],
    timeline: [
      { state: "CREATED",   at: daysAgo(1) },
      { state: "APPROVED",  at: hoursAgo(20), by: "F. Villanueva (Finance)" },
      { state: "PREPARING", at: hoursAgo(3),  by: "WH-MNL Picker 02", note: "3 of 4 lines picked" },
    ],
    pickProgress: 0.75,
  },
  {
    id: "SO-2026-0414",
    customerId: "C-1318",
    agentId: "A-21",
    warehouseId: "WH-CEB",
    state: "SHIPPED",
    createdAt: daysAgo(2),
    needBy: daysAgo(0),
    cwt2307: false,
    poRef: "PO-CDUH-26-0455",
    waybill: "JNT-PH-08841029",
    lines: [
      seed("CON-IV-018", 80),
      seed("CON-SY-10", 800),
      seed("CON-MSK-N95", 400),
    ],
    timeline: [
      { state: "CREATED",   at: daysAgo(2) },
      { state: "APPROVED",  at: daysAgo(1.7) },
      { state: "PREPARING", at: daysAgo(1.2) },
      { state: "SHIPPED",   at: hoursAgo(14), by: "WH-CEB Dispatch", note: "JRS Express · WB JNT-PH-08841029" },
    ],
  },
  {
    id: "SO-2026-0413",
    customerId: "C-1402",
    agentId: "A-33",
    warehouseId: "WH-DVO",
    state: "DELIVERED",
    createdAt: daysAgo(4),
    needBy: daysAgo(1),
    cwt2307: true,
    poRef: "PO-DDH-26-1990",
    waybill: "LBC-PH-77410022",
    lines: [
      seed("CON-GLV-M", 40),
      seed("CON-GLV-L", 40),
      seed("CON-ALC-500", 120),
      seed("CON-GZE-4", 600),
    ],
    timeline: [
      { state: "CREATED",   at: daysAgo(4) },
      { state: "APPROVED",  at: daysAgo(3.6) },
      { state: "PREPARING", at: daysAgo(3.0) },
      { state: "SHIPPED",   at: daysAgo(2.0) },
      { state: "DELIVERED", at: daysAgo(0.4), by: "DDH Receiving Bay 3", note: "Signed by R. Mariano" },
    ],
  },
  {
    id: "SO-2026-0412",
    customerId: "C-1577",
    agentId: "A-21",
    warehouseId: "WH-CEB",
    state: "DELIVERED",
    createdAt: daysAgo(6),
    needBy: daysAgo(2),
    cwt2307: false,
    poRef: "PO-IMH-26-0773",
    lines: [
      seed("CON-SY-3", 1000),
      seed("CON-LCT-22", 200),
      seed("CON-BAG-1L", 40),
    ],
    timeline: [
      { state: "CREATED",   at: daysAgo(6) },
      { state: "APPROVED",  at: daysAgo(5.7) },
      { state: "PREPARING", at: daysAgo(5.2) },
      { state: "SHIPPED",   at: daysAgo(3.4) },
      { state: "DELIVERED", at: daysAgo(1.8), by: "IMH Stockroom", note: "All lines accepted" },
    ],
  },
  {
    id: "SO-2026-0411",
    customerId: "C-1501",
    agentId: "A-07",
    warehouseId: "WH-MNL",
    state: "APPROVED",
    createdAt: hoursAgo(11),
    needBy: daysAgo(-6),
    cwt2307: true,
    poRef: "PO-BGH-26-0220",
    lines: [
      seed("EQP-MON-BP", 6),
      seed("EQP-OXM-FP", 4),
      seed("EQP-NBL-KT", 12),
    ],
    timeline: [
      { state: "CREATED",  at: hoursAgo(11) },
      { state: "APPROVED", at: hoursAgo(2),  by: "F. Villanueva (Finance)" },
    ],
  },
];

// Pre-compute totals on each order (so views don't recalc constantly)
ORDERS.forEach((o) => {
  o.subtotal = orderSub(o.lines);
  o.vat = vatOf(o.subtotal);
  o.cwt = cwtOf(o.subtotal, 0.02, o.cwt2307);
  o.total = o.subtotal + o.vat - o.cwt;
});

// Lookup helpers
const customerById  = (id) => CUSTOMERS.find((c) => c.id === id);
const agentById     = (id) => AGENTS.find((a) => a.id === id);
const warehouseById = (id) => WAREHOUSES.find((w) => w.id === id);
const productBySku  = (sku) => CATALOG.find((p) => p.sku === sku);

// State transition map (very simple FSM)
const NEXT_STATE = {
  PENDING:   { next: "APPROVED",  label: "Approve order",  role: ["FINANCE", "ADMIN"] },
  APPROVED:  { next: "PREPARING", label: "Start preparing", role: ["WAREHOUSE", "ADMIN"] },
  PREPARING: { next: "SHIPPED",   label: "Mark shipped",    role: ["WAREHOUSE", "ADMIN"] },
  SHIPPED:   { next: "DELIVERED", label: "Confirm delivery",role: ["WAREHOUSE", "ADMIN", "FINANCE"] },
  DELIVERED: { next: null },
  CANCELLED: { next: null },
};

Object.assign(window, {
  PESO, SHORT_PESO, CATALOG, CUSTOMERS, AGENTS, WAREHOUSES,
  STATES, STATE_LABEL, ORDERS, NEXT_STATE,
  customerById, agentById, warehouseById, productBySku,
  orderSub, vatOf, cwtOf, totalOf, lineSub, hoursAgo, daysAgo,
});
