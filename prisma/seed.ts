import {
  PrismaClient,
  Role,
  ItemCategory,
  AssetCategory,
  SupplierStatus,
  JeSource,
  InvoiceStatus,
  BillStatus,
  BirStatus,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(d: number) {
  return new Date(Date.now() + d * 86_400_000);
}
function daysAgo(d: number) {
  return daysFromNow(-d);
}
function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000);
}

async function main() {
  console.log("Seeding…");

  // ── Warehouses ────────────────────────────────────────────────────────────
  const mnl = await prisma.warehouse.upsert({
    where: { code: "MNL" },
    update: {},
    create: { code: "MNL", name: "Manila — Pasig DC", city: "Pasig" },
  });
  const ceb = await prisma.warehouse.upsert({
    where: { code: "CEB" },
    update: {},
    create: { code: "CEB", name: "Cebu DC", city: "Cebu City" },
  });
  const dvo = await prisma.warehouse.upsert({
    where: { code: "DVO" },
    update: {},
    create: { code: "DVO", name: "Davao DC", city: "Davao City" },
  });

  // ── Customers ─────────────────────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.upsert({ where: { code: "C-1042" }, update: {}, create: { code: "C-1042", name: "St. Luke's Medical Center — QC",    type: "HOSPITAL", tin: "000-111-222-000", region: "NCR", city: "Quezon City", terms: "Net 30", creditLimit: 2_500_000, contactEmail: "procurement@stlukes.com.ph" } }),
    prisma.customer.upsert({ where: { code: "C-1187" }, update: {}, create: { code: "C-1187", name: "Makati Medical Center",              type: "HOSPITAL", tin: "000-222-333-000", region: "NCR", city: "Makati",      terms: "Net 30", creditLimit: 3_000_000, contactEmail: "supply@makatimed.net.ph" } }),
    prisma.customer.upsert({ where: { code: "C-1203" }, update: {}, create: { code: "C-1203", name: "The Medical City — Ortigas",         type: "HOSPITAL", tin: "000-333-444-000", region: "NCR", city: "Pasig",       terms: "Net 45", creditLimit: 2_200_000, contactEmail: "purchasing@themedicalcity.com" } }),
    prisma.customer.upsert({ where: { code: "C-1318" }, update: {}, create: { code: "C-1318", name: "Cebu Doctors' University Hospital",  type: "HOSPITAL", tin: "000-444-555-000", region: "VII", city: "Cebu City",   terms: "Net 30", creditLimit: 1_800_000 } }),
    prisma.customer.upsert({ where: { code: "C-1402" }, update: {}, create: { code: "C-1402", name: "Davao Doctors Hospital",             type: "HOSPITAL", tin: "000-555-666-000", region: "XI",  city: "Davao City",  terms: "Net 30", creditLimit: 1_500_000 } }),
    prisma.customer.upsert({ where: { code: "C-1455" }, update: {}, create: { code: "C-1455", name: "Asian Hospital and Medical Center",  type: "HOSPITAL", tin: "000-666-777-000", region: "NCR", city: "Muntinlupa",  terms: "Net 30", creditLimit: 2_000_000 } }),
    prisma.customer.upsert({ where: { code: "C-1501" }, update: {}, create: { code: "C-1501", name: "Baguio General Hospital",            type: "HOSPITAL", tin: "000-777-888-000", region: "CAR", city: "Baguio",      terms: "Net 60", creditLimit: 900_000 } }),
    prisma.customer.upsert({ where: { code: "C-1577" }, update: {}, create: { code: "C-1577", name: "Iloilo Mission Hospital",            type: "HOSPITAL", tin: "000-888-999-000", region: "VI",  city: "Iloilo",      terms: "Net 30", creditLimit: 800_000 } }),
  ]);

  // ── Suppliers ─────────────────────────────────────────────────────────────
  const suppliers = await Promise.all([
    prisma.supplier.upsert({ where: { code: "SUP-101" }, update: {}, create: { code: "SUP-101", name: "Apex Devices Corp.",         contactEmail: "orders@apexdevices.ph",   city: "Makati",   leadTimeDays: 14, status: "ACTIVE" as SupplierStatus } }),
    prisma.supplier.upsert({ where: { code: "SUP-102" }, update: {}, create: { code: "SUP-102", name: "Pacific Health Supplies",    contactEmail: "supply@pacifichlt.ph",    city: "Manila",   leadTimeDays: 7,  status: "ACTIVE" as SupplierStatus } }),
    prisma.supplier.upsert({ where: { code: "SUP-103" }, update: {}, create: { code: "SUP-103", name: "MedCore Distribution Inc.",  contactEmail: "med@medcore.com.ph",      city: "Cebu City",leadTimeDays: 10, status: "ACTIVE" as SupplierStatus } }),
    prisma.supplier.upsert({ where: { code: "SUP-104" }, update: {}, create: { code: "SUP-104", name: "Mindray Medical PH",         contactEmail: "sales@mindray.ph",        city: "Makati",   leadTimeDays: 21, status: "ACTIVE" as SupplierStatus } }),
  ]);

  // ── Catalog ───────────────────────────────────────────────────────────────
  const catalog = await Promise.all([
    prisma.catalogItem.upsert({ where: { sku: "CON-IV-018"  }, update: {}, create: { sku: "CON-IV-018",  name: "IV Administration Set, 18-drop",    category: "CONSUMABLE" as ItemCategory, unit: "pc",  unitPrice: 78.00,    active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "CON-SY-10"   }, update: {}, create: { sku: "CON-SY-10",   name: "Disposable Syringe 10mL",           category: "CONSUMABLE" as ItemCategory, unit: "pc",  unitPrice: 14.50,    active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "CON-GLV-M"   }, update: {}, create: { sku: "CON-GLV-M",   name: "Nitrile Exam Glove, Medium",        category: "CONSUMABLE" as ItemCategory, unit: "box", unitPrice: 365.00,   active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "CON-MSK-N95" }, update: {}, create: { sku: "CON-MSK-N95", name: "N95 Respirator, cup-style",         category: "CONSUMABLE" as ItemCategory, unit: "pc",  unitPrice: 38.00,    active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "CON-GZE-4"   }, update: {}, create: { sku: "CON-GZE-4",   name: "Sterile Gauze Pad 4×4 in",          category: "CONSUMABLE" as ItemCategory, unit: "pc",  unitPrice: 9.75,     active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "CON-BAG-1L"  }, update: {}, create: { sku: "CON-BAG-1L",  name: "PNSS 0.9% Saline, 1L",              category: "CONSUMABLE" as ItemCategory, unit: "btl", unitPrice: 64.00,    active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "CON-LCT-22"  }, update: {}, create: { sku: "CON-LCT-22",  name: "IV Cannula 22G",                    category: "CONSUMABLE" as ItemCategory, unit: "pc",  unitPrice: 22.00,    active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "EQP-MON-BP"  }, update: {}, create: { sku: "EQP-MON-BP",  name: "Patient Monitor, BP cuff (adult)",  category: "ACCESSORY"  as ItemCategory, unit: "pc",  unitPrice: 1850.00,  brand: "Philips",  active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "EQP-OXM-FP"  }, update: {}, create: { sku: "EQP-OXM-FP",  name: "SpO₂ Sensor, finger probe",          category: "ACCESSORY"  as ItemCategory, unit: "pc",  unitPrice: 2200.00,  brand: "Nonin",    active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "EQP-VNT-ICU" }, update: {}, create: { sku: "EQP-VNT-ICU", name: "Ventilator, Adult ICU",             category: "EQUIPMENT"  as ItemCategory, unit: "unit",unitPrice: 850000.00,brand: "Mindray",  active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "EQP-DEF-AED" }, update: {}, create: { sku: "EQP-DEF-AED", name: "Defibrillator AED Plus",            category: "EQUIPMENT"  as ItemCategory, unit: "unit",unitPrice: 185000.00,brand: "Zoll",     active: true } }),
    prisma.catalogItem.upsert({ where: { sku: "EQP-MON-12L" }, update: {}, create: { sku: "EQP-MON-12L", name: "Patient Monitor 12-lead",           category: "EQUIPMENT"  as ItemCategory, unit: "unit",unitPrice: 240000.00,brand: "Mindray",  active: true } }),
  ]);

  const catMap = Object.fromEntries(catalog.map((c) => [c.sku, c]));

  // ── Stock ─────────────────────────────────────────────────────────────────
  const consumables = catalog.filter((c) => c.category === "CONSUMABLE" || c.category === "ACCESSORY");
  for (const item of consumables) {
    for (const wh of [mnl, ceb]) {
      await prisma.stock.upsert({
        where: { skuId_warehouseId: { skuId: item.id, warehouseId: wh.id } },
        update: {},
        create: { skuId: item.id, warehouseId: wh.id, onHand: 500 + Math.floor(Math.random() * 1000), reserved: 20, reorderAt: 50 },
      });
    }
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  const pw = await hash("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@medisupply.ph" },
    update: {},
    create: { email: "admin@medisupply.ph", name: "Admin User", passwordHash: pw, role: "ADMIN" as Role },
  });
  const financeUser = await prisma.user.upsert({
    where: { email: "finance@medisupply.ph" },
    update: {},
    create: { email: "finance@medisupply.ph", name: "F. Villanueva", passwordHash: pw, role: "FINANCE" as Role },
  });
  await prisma.user.upsert({
    where: { email: "agent@medisupply.ph" },
    update: {},
    create: { email: "agent@medisupply.ph", name: "Sales Agent", passwordHash: pw, role: "AGENT" as Role },
  });
  await prisma.user.upsert({
    where: { email: "warehouse@medisupply.ph" },
    update: {},
    create: { email: "warehouse@medisupply.ph", name: "Warehouse Staff", passwordHash: pw, role: "WAREHOUSE" as Role },
  });
  await prisma.user.upsert({
    where: { email: "procurement@stlukes.com.ph" },
    update: {},
    create: {
      email: "procurement@stlukes.com.ph", name: "St. Luke's Procurement",
      passwordHash: pw, role: "CUSTOMER" as Role, customerId: customers[0].id,
    },
  });

  const tech = await prisma.technician.upsert({
    where: { id: (await prisma.technician.findFirst({ where: { name: "Juan dela Cruz" } }))?.id ?? "notfound" },
    update: {},
    create: { name: "Juan dela Cruz", specialization: "Biomedical Equipment" },
  });
  await prisma.user.upsert({
    where: { email: "tech@medisupply.ph" },
    update: {},
    create: { email: "tech@medisupply.ph", name: "Juan dela Cruz", passwordHash: pw, role: "TECHNICIAN" as Role, technicianId: tech.id },
  });
  await prisma.user.upsert({
    where: { email: "driver@medisupply.ph" },
    update: {},
    create: { email: "driver@medisupply.ph", name: "Rodel Reyes", passwordHash: pw, role: "DRIVER" as Role },
  });

  // ── Customer portal users (one per hospital) ──────────────────────────────
  const customerPortalUsers = [
    { email: "procurement@stlukes.com.ph",    name: "St. Luke's QC Procurement",     custIdx: 0 },
    { email: "supply@makatimed.net.ph",        name: "Makati Med Supply",             custIdx: 1 },
    { email: "purchasing@themedicalcity.com",  name: "The Medical City Purchasing",   custIdx: 2 },
    { email: "supply@cduhosp.edu.ph",          name: "CDUH Supply Office",            custIdx: 3 },
    { email: "procurement@davadocs.com.ph",    name: "Davao Docs Procurement",        custIdx: 4 },
    { email: "supply@asianhospital.com.ph",    name: "Asian Hospital Supply",         custIdx: 5 },
    { email: "supply@baguiogeneral.gov.ph",    name: "BGH Supply Division",           custIdx: 6 },
    { email: "admin@iloilomission.com.ph",     name: "IMH Admin",                     custIdx: 7 },
  ];
  for (const u of customerPortalUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, passwordHash: pw, role: "CUSTOMER" as Role, customerId: customers[u.custIdx].id },
    });
  }

  // ── Assets ────────────────────────────────────────────────────────────────
  const assets = await Promise.all([
    prisma.asset.upsert({ where: { serialNumber: "MR-VNT-2022-001" }, update: {}, create: { name: "Ventilator ICU-01",     serialNumber: "MR-VNT-2022-001", category: "VENTILATOR"    as AssetCategory, warehouseId: mnl.id, purchasedAt: new Date("2022-01-15"), maintenanceIntervalDays: 90 } }),
    prisma.asset.upsert({ where: { serialNumber: "MR-MON-2021-002" }, update: {}, create: { name: "Patient Monitor PM-02", serialNumber: "MR-MON-2021-002", category: "PATIENT_MONITOR" as AssetCategory, warehouseId: mnl.id, purchasedAt: new Date("2021-06-10"), maintenanceIntervalDays: 90 } }),
    prisma.asset.upsert({ where: { serialNumber: "ZL-AED-2023-001" }, update: {}, create: { name: "Defibrillator AED-01",  serialNumber: "ZL-AED-2023-001", category: "DEFIBRILLATOR"  as AssetCategory, warehouseId: mnl.id, purchasedAt: new Date("2023-03-20"), maintenanceIntervalDays: 90 } }),
  ]);

  // ── Sample orders ─────────────────────────────────────────────────────────
  async function upsertOrder(
    id: string, custId: string, whId: string,
    state: string, cwt2307: boolean,
    lines: { sku: string; qty: number; unitPrice: number }[]
  ) {
    const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const vat = subtotal * 0.12;
    const cwt = cwt2307 ? subtotal * 0.02 : 0;
    const total = subtotal + vat - cwt;

    const exists = await prisma.order.findUnique({ where: { id } });
    if (!exists) {
      await prisma.order.create({
        data: {
          id, customerId: custId, agentId: adminUser.id, warehouseId: whId,
          state: state as any, cwt2307, subtotal, vat, cwt, total,
          lines: {
            create: lines.map((l) => {
              const item = catMap[l.sku];
              return { skuId: item.id, name: item.name, unit: item.unit, qty: l.qty, unitPrice: l.unitPrice, lineTotal: l.qty * l.unitPrice };
            }),
          },
          events: { create: { state, actorId: adminUser.id, note: "Seeded" } },
        },
      });
    }
  }

  await upsertOrder("SO-2026-0418", customers[0].id, mnl.id, "PENDING",   false, [{ sku: "CON-IV-018",  qty: 1000, unitPrice: 78 },   { sku: "CON-SY-10",   qty: 2000, unitPrice: 14.5 }]);
  await upsertOrder("SO-2026-0417", customers[1].id, mnl.id, "APPROVED",  false, [{ sku: "CON-GLV-M",  qty: 200,  unitPrice: 365 },  { sku: "CON-MSK-N95", qty: 500,  unitPrice: 38  }]);
  await upsertOrder("SO-2026-0416", customers[2].id, ceb.id, "PREPARING", false, [{ sku: "CON-BAG-1L", qty: 300,  unitPrice: 64 }]);
  await upsertOrder("SO-2026-0415", customers[3].id, mnl.id, "SHIPPED",   false, [{ sku: "EQP-MON-BP", qty: 10,   unitPrice: 1850 }]);
  await upsertOrder("SO-2026-0413", customers[4].id, dvo.id, "DELIVERED", true,  [{ sku: "CON-LCT-22", qty: 2000, unitPrice: 22 }]);
  await upsertOrder("SO-2026-0412", customers[7].id, mnl.id, "DELIVERED", false, [{ sku: "CON-GZE-4",  qty: 1000, unitPrice: 9.75 }]);

  // ── Work orders ───────────────────────────────────────────────────────────
  for (const [asset, type, status, priority, title] of [
    [assets[0], "PREVENTIVE", "IN_PROGRESS", "HIGH",   "Q2 Preventive Maintenance — Ventilator ICU-01"],
    [assets[1], "CORRECTIVE", "NEEDS_PARTS", "URGENT", "Screen calibration failure — PM-02"],
    [assets[2], "PREVENTIVE", "PENDING",     "MEDIUM", "Annual safety check — AED-01"],
  ] as const) {
    await prisma.workOrder.upsert({
      where: { id: `WO-${asset.serialNumber}` },
      update: {},
      create: {
        id: `WO-${asset.serialNumber}`, assetId: asset.id, technicianId: tech.id,
        type, title, status: status as any, priority: priority as any,
        dueDate: daysFromNow(7),
      },
    });
  }

  // ── Accounting seed ───────────────────────────────────────────────────────
  // Journal entries
  const jeData = [
    { id: "JE-2026-04-0418", date: hoursAgo(0.4), source: "AR" as JeSource, ref: "INV-2026-0418", memo: "Sale to St. Luke's QC",                      lines: [{ code: "1100", dr: 312480, cr: 0 }, { code: "4000", dr: 0, cr: 279000 }, { code: "2100", dr: 0, cr: 33480 }, { code: "5000", dr: 124200, cr: 0 }, { code: "1200", dr: 0, cr: 124200 }] },
    { id: "JE-2026-04-0417", date: hoursAgo(2),   source: "AR" as JeSource, ref: "INV-2026-0417", memo: "Sale to Makati Med",                           lines: [{ code: "1100", dr: 184800, cr: 0 }, { code: "4000", dr: 0, cr: 165000 }, { code: "2100", dr: 0, cr: 19800 }, { code: "5000", dr: 73000, cr: 0 }, { code: "1200", dr: 0, cr: 73000 }] },
    { id: "JE-2026-04-0416", date: hoursAgo(8),   source: "AP" as JeSource, ref: "PO-2026-0294",  memo: "PO receipt — Apex Devices",                    lines: [{ code: "1500", dr: 750000, cr: 0 }, { code: "2110", dr: 90000, cr: 0 }, { code: "2000", dr: 0, cr: 825000 }, { code: "2150", dr: 0, cr: 15000 }] },
    { id: "JE-2026-04-0415", date: hoursAgo(20),  source: "BANK" as JeSource, ref: "BPI-CK-1142", memo: "Payment received — Davao Doctors",              lines: [{ code: "1010", dr: 268320, cr: 0 }, { code: "1150", dr: 5364, cr: 0 }, { code: "1100", dr: 0, cr: 273684 }] },
    { id: "JE-2026-04-0414", date: hoursAgo(26),  source: "INV" as JeSource, ref: "TR-0034",      memo: "Inter-warehouse transfer MNL→CEB",              lines: [{ code: "1210", dr: 73000, cr: 0 }, { code: "1200", dr: 0, cr: 73000 }] },
    { id: "JE-2026-04-0413", date: hoursAgo(30),  source: "AR" as JeSource, ref: "INV-2026-0414", memo: "Sale to CDU Hospital",                          lines: [{ code: "1100", dr: 92400, cr: 0 }, { code: "4000", dr: 0, cr: 82500 }, { code: "2100", dr: 0, cr: 9900 }, { code: "5000", dr: 36900, cr: 0 }, { code: "1210", dr: 0, cr: 36900 }] },
    { id: "JE-2026-04-0412", date: hoursAgo(38),  source: "PAYROLL" as JeSource, ref: "PAY-2026-04-30", memo: "Bi-monthly payroll · 60 employees",     lines: [{ code: "5100", dr: 1820000, cr: 0 }, { code: "1020", dr: 0, cr: 1488800 }, { code: "2160", dr: 0, cr: 196000 }, { code: "2200", dr: 0, cr: 78400 }, { code: "2210", dr: 0, cr: 32200 }, { code: "2220", dr: 0, cr: 24600 }] },
    { id: "JE-2026-04-0411", date: hoursAgo(48),  source: "AP" as JeSource, ref: "BILL-MERALCO-04", memo: "Meralco — April electricity",                lines: [{ code: "5300", dr: 187500, cr: 0 }, { code: "2110", dr: 22500, cr: 0 }, { code: "2000", dr: 0, cr: 210000 }] },
    { id: "JE-2026-04-0410", date: hoursAgo(56),  source: "AP" as JeSource, ref: "BILL-MAYNILAD-04", memo: "Maynilad water — April",                   lines: [{ code: "5300", dr: 38400, cr: 0 }, { code: "2110", dr: 4608, cr: 0 }, { code: "2000", dr: 0, cr: 43008 }] },
    { id: "JE-2026-04-0409", date: hoursAgo(72),  source: "BANK" as JeSource, ref: "BPI-CK-1141", memo: "Payment received — IMH",                       lines: [{ code: "1010", dr: 64680, cr: 0 }, { code: "1100", dr: 0, cr: 64680 }] },
    { id: "JE-2026-04-0408", date: hoursAgo(96),  source: "AP" as JeSource, ref: "PO-2026-0297",  memo: "PO receipt — Pacific Health",                  lines: [{ code: "1210", dr: 171428, cr: 0 }, { code: "2110", dr: 20571, cr: 0 }, { code: "2000", dr: 0, cr: 192000 }] },
    { id: "JE-2026-04-0407", date: daysAgo(5),    source: "GL" as JeSource, ref: "DEPR-2026-04",  memo: "Monthly depreciation — equipment",              lines: [{ code: "5500", dr: 142000, cr: 0 }, { code: "1510", dr: 0, cr: 142000 }] },
    { id: "JE-2026-04-0406", date: daysAgo(8),    source: "AR" as JeSource, ref: "INV-2026-0413", memo: "Sale to Davao Doctors — delivered",              lines: [{ code: "1100", dr: 273684, cr: 0 }, { code: "4000", dr: 0, cr: 244343 }, { code: "2100", dr: 0, cr: 29321 }, { code: "1150", dr: 0, cr: 4886 }, { code: "5000", dr: 108000, cr: 0 }, { code: "1220", dr: 0, cr: 108000 }] },
    { id: "JE-2026-04-0405", date: daysAgo(12),   source: "GL" as JeSource, ref: "ADJ-RENT-04",   memo: "Reclass prepaid rent April",                    lines: [{ code: "5200", dr: 240000, cr: 0 }, { code: "1300", dr: 0, cr: 240000 }] },
  ];

  for (const je of jeData) {
    const exists = await prisma.journalEntry.findUnique({ where: { id: je.id } });
    if (!exists) {
      await prisma.journalEntry.create({
        data: {
          id: je.id, date: je.date, source: je.source,
          ref: je.ref, memo: je.memo, postedById: financeUser.id,
          lines: { create: je.lines.map((l) => ({ code: l.code, dr: l.dr, cr: l.cr })) },
        },
      });
    }
  }

  // Invoices (AR)
  const invData = [
    { id: "INV-2026-0418", custCode: "C-1042", soId: "SO-2026-0418", issued: hoursAgo(0.4), due: daysFromNow(30), amount: 312480, paid: 0,      status: "OPEN"    as InvoiceStatus },
    { id: "INV-2026-0417", custCode: "C-1187", soId: "SO-2026-0417", issued: hoursAgo(2),   due: daysFromNow(30), amount: 184800, paid: 0,      status: "OPEN"    as InvoiceStatus },
    { id: "INV-2026-0416", custCode: "C-1455", soId: "SO-2026-0416", issued: daysAgo(2),    due: daysFromNow(28), amount: 156800, paid: 0,      status: "OPEN"    as InvoiceStatus },
    { id: "INV-2026-0415", custCode: "C-1318", soId: "SO-2026-0415", issued: daysAgo(7),    due: daysFromNow(23), amount: 220500, paid: 80000,  status: "PARTIAL" as InvoiceStatus },
    { id: "INV-2026-0414", custCode: "C-1318", soId: null,           issued: daysAgo(2),    due: daysFromNow(28), amount: 92400,  paid: 0,      status: "OPEN"    as InvoiceStatus },
    { id: "INV-2026-0413", custCode: "C-1402", soId: "SO-2026-0413", issued: daysAgo(8),    due: daysFromNow(22), amount: 273684, paid: 273684, status: "PAID"    as InvoiceStatus },
    { id: "INV-2026-0412", custCode: "C-1577", soId: "SO-2026-0412", issued: daysAgo(12),   due: daysFromNow(18), amount: 64680,  paid: 64680,  status: "PAID"    as InvoiceStatus },
    { id: "INV-2026-0411", custCode: "C-1042", soId: null,           issued: daysAgo(35),   due: daysAgo(5),      amount: 489000, paid: 0,      status: "OVERDUE" as InvoiceStatus },
    { id: "INV-2026-0410", custCode: "C-1187", soId: null,           issued: daysAgo(48),   due: daysAgo(18),     amount: 178400, paid: 0,      status: "OVERDUE" as InvoiceStatus },
    { id: "INV-2026-0409", custCode: "C-1501", soId: null,           issued: daysAgo(62),   due: daysAgo(32),     amount: 248000, paid: 0,      status: "OVERDUE" as InvoiceStatus },
    { id: "INV-2026-0408", custCode: "C-1455", soId: null,           issued: daysAgo(78),   due: daysAgo(48),     amount: 92400,  paid: 0,      status: "OVERDUE" as InvoiceStatus },
  ];

  for (const inv of invData) {
    const cust = customers.find((c) => c.code === inv.custCode);
    if (!cust) continue;
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {},
      create: {
        id: inv.id, customerId: cust.id,
        soId: inv.soId ?? undefined,
        issued: inv.issued, due: inv.due,
        amount: inv.amount, paid: inv.paid, status: inv.status,
      },
    });
  }

  // Bills (AP)
  const billData = [
    { id: "BILL-2026-0211", suppCode: "SUP-101", ref: "PO-2026-0294",  vendor: null,      note: null,                              issued: hoursAgo(8),  due: daysFromNow(37), amount: 825000, paid: 0,      status: "OPEN"    as BillStatus },
    { id: "BILL-MERALCO-04",suppCode: null,       ref: null,            vendor: "Meralco", note: "April electricity · WH-MNL + HQ", issued: hoursAgo(48), due: daysFromNow(10), amount: 210000, paid: 0,      status: "OPEN"    as BillStatus },
    { id: "BILL-MAYNILAD-04",suppCode: null,      ref: null,            vendor: "Maynilad",note: "April water · WH-MNL",            issued: hoursAgo(56), due: daysFromNow(12), amount: 43008,  paid: 0,      status: "OPEN"    as BillStatus },
    { id: "BILL-2026-0210", suppCode: "SUP-102", ref: "PO-2026-0297",  vendor: null,      note: null,                              issued: hoursAgo(96), due: daysFromNow(22), amount: 192000, paid: 0,      status: "OPEN"    as BillStatus },
    { id: "BILL-2026-0209", suppCode: "SUP-104", ref: "PO-2026-0291",  vendor: null,      note: null,                              issued: daysAgo(8),   due: daysAgo(7),      amount: 128000, paid: 0,      status: "OVERDUE" as BillStatus },
    { id: "BILL-2026-0208", suppCode: "SUP-103", ref: "PO-2026-0289",  vendor: null,      note: null,                              issued: daysAgo(15),  due: daysFromNow(0),  amount: 98000,  paid: 0,      status: "DUE"     as BillStatus },
    { id: "BILL-2026-0207", suppCode: "SUP-101", ref: "PO-2026-0287",  vendor: null,      note: null,                              issued: daysAgo(38),  due: daysAgo(8),      amount: 165000, paid: 100000, status: "PARTIAL" as BillStatus },
    { id: "BILL-2026-0206", suppCode: "SUP-102", ref: "PO-2026-0285",  vendor: null,      note: null,                              issued: daysAgo(52),  due: daysAgo(22),     amount: 412000, paid: 412000, status: "PAID"    as BillStatus },
  ];

  for (const b of billData) {
    const sup = b.suppCode ? suppliers.find((s) => s.code === b.suppCode) : null;
    await prisma.bill.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        supplierId: sup?.id,
        vendor: b.vendor ?? undefined,
        ref: b.ref ?? undefined,
        note: b.note ?? undefined,
        issued: b.issued, due: b.due,
        amount: b.amount, paid: b.paid, status: b.status,
      },
    });
  }

  // BIR Filings
  const birData = [
    { id: "2550Q-2026Q1",    form: "BIR 2550Q",   period: "2026 Q1",  desc: "Quarterly VAT Return",                   due: daysFromNow(16), amount: 482500, status: "DUE"     as BirStatus },
    { id: "1601EQ-2026Q1",   form: "BIR 1601-EQ", period: "2026 Q1",  desc: "Quarterly EWT Remittance",               due: daysFromNow(22), amount: 168000, status: "DUE"     as BirStatus },
    { id: "1601C-04-2026",   form: "BIR 1601-C",  period: "Apr 2026", desc: "Monthly Withholding on Compensation",    due: daysAgo(1),      amount: 196000, status: "FILED"   as BirStatus },
    { id: "0619E-04-2026",   form: "BIR 0619-E",  period: "Apr 2026", desc: "Monthly EWT Remittance",                 due: daysAgo(2),      amount: 56000,  status: "FILED"   as BirStatus },
    { id: "2550M-04-2026",   form: "BIR 2550M",   period: "Apr 2026", desc: "Monthly VAT Return",                     due: daysAgo(11),     amount: 158400, status: "FILED"   as BirStatus },
    { id: "1701Q-2026Q1",    form: "BIR 1701Q",   period: "2026 Q1",  desc: "Quarterly Income Tax Return",            due: daysFromNow(50), amount: 0,      status: "PENDING" as BirStatus },
  ];

  for (const f of birData) {
    await prisma.birFiling.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
