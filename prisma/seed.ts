import { PrismaClient, Role, ItemCategory, AssetCategory, SupplierStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  // ── Warehouses ────────────────────────────────────────────────────────────
  const [wh1, wh2] = await Promise.all([
    prisma.warehouse.upsert({
      where: { id: "WH-MNL" },
      update: {},
      create: { id: "WH-MNL", name: "Manila Central", address: "123 Rizal Ave, Manila", city: "Manila" },
    }),
    prisma.warehouse.upsert({
      where: { id: "WH-CDO" },
      update: {},
      create: { id: "WH-CDO", name: "Cagayan de Oro", address: "45 Corrales Ave, CDO", city: "Cagayan de Oro" },
    }),
  ]);

  // ── Customers ─────────────────────────────────────────────────────────────
  const customers = await Promise.all(
    [
      { id: "CUST-001", name: "St. Luke's Medical Center", type: "HOSPITAL" as const, tin: "000-111-222-000", city: "Quezon City", contactEmail: "procurement@stlukes.com.ph" },
      { id: "CUST-002", name: "Makati Medical Center",     type: "HOSPITAL" as const, tin: "000-222-333-000", city: "Makati",      contactEmail: "supply@makatimed.net.ph" },
      { id: "CUST-003", name: "The Medical City",          type: "HOSPITAL" as const, tin: "000-333-444-000", city: "Pasig",       contactEmail: "purchasing@themedicalcity.com" },
      { id: "CUST-004", name: "HealthPlus Clinic Group",   type: "CLINIC"   as const, tin: "000-444-555-000", city: "Cebu City",   contactEmail: "admin@healthplus.ph" },
      { id: "CUST-005", name: "Cardinal Santos Medical",   type: "HOSPITAL" as const, tin: "000-555-666-000", city: "San Juan",    contactEmail: "csmc.supply@gmail.com" },
    ].map((c) =>
      prisma.customer.upsert({ where: { id: c.id }, update: {}, create: c })
    )
  );

  // ── Suppliers ─────────────────────────────────────────────────────────────
  await Promise.all(
    [
      { id: "SUP-001", name: "Mindray Medical Philippines", contactEmail: "sales@mindray.ph", leadTimeDays: 14, status: "ACTIVE" as SupplierStatus },
      { id: "SUP-002", name: "Welch Allyn Distributor PH",  contactEmail: "orders@welchallyn.ph", leadTimeDays: 21, status: "ACTIVE" as SupplierStatus },
      { id: "SUP-003", name: "Medtronic Asia Pacific",      contactEmail: "apmea@medtronic.com", leadTimeDays: 30, status: "ACTIVE" as SupplierStatus },
    ].map((s) =>
      prisma.supplier.upsert({ where: { id: s.id }, update: {}, create: s })
    )
  );

  // ── Catalog ───────────────────────────────────────────────────────────────
  const catalog = await Promise.all(
    [
      { id: "SKU-VENT-001", name: "Ventilator, Adult ICU",           category: "EQUIPMENT"   as ItemCategory, brand: "Mindray",    unitPrice: 850000, unit: "unit" },
      { id: "SKU-DEFIB-001",name: "Defibrillator AED Plus",          category: "EQUIPMENT"   as ItemCategory, brand: "Zoll",       unitPrice: 185000, unit: "unit" },
      { id: "SKU-MON-001",  name: "Patient Monitor 12-lead",         category: "EQUIPMENT"   as ItemCategory, brand: "Mindray",    unitPrice: 240000, unit: "unit" },
      { id: "SKU-SYR-100",  name: "Syringe 10ml Sterile (box/100)", category: "CONSUMABLE"  as ItemCategory, brand: "Terumo",     unitPrice: 480,    unit: "box"  },
      { id: "SKU-GLOVE-M",  name: "Nitrile Gloves Medium (box/100)",category: "CONSUMABLE"  as ItemCategory, brand: "Ansell",     unitPrice: 380,    unit: "box"  },
      { id: "SKU-MASK-N95",  name: "N95 Respirator Mask (box/20)",  category: "CONSUMABLE"  as ItemCategory, brand: "3M",         unitPrice: 1200,   unit: "box"  },
      { id: "SKU-IV-500",   name: "IV Fluid NaCl 0.9% 500ml",       category: "CONSUMABLE"  as ItemCategory, brand: "Baxter",     unitPrice: 85,     unit: "bag"  },
      { id: "SKU-SUTURE-3", name: "Suture Prolene 3-0 (box/12)",    category: "CONSUMABLE"  as ItemCategory, brand: "Ethicon",    unitPrice: 2800,   unit: "box"  },
      { id: "SKU-XRAY-14",  name: "X-Ray Film 14×17 (box/100)",     category: "CONSUMABLE"  as ItemCategory, brand: "Kodak",      unitPrice: 6500,   unit: "box"  },
      { id: "SKU-STET-001", name: "Stethoscope Cardiology III",     category: "INSTRUMENT"  as ItemCategory, brand: "Littmann",   unitPrice: 14500,  unit: "unit" },
    ].map((item) =>
      prisma.catalogItem.upsert({ where: { id: item.id }, update: {}, create: { ...item, active: true } })
    )
  );

  // ── Stock ─────────────────────────────────────────────────────────────────
  await Promise.all(
    catalog.slice(3).map((item) =>
      prisma.stock.upsert({
        where: { skuId_warehouseId: { skuId: item.id, warehouseId: wh1.id } },
        update: {},
        create: { skuId: item.id, warehouseId: wh1.id, onHand: 500, reserved: 20, reorderAt: 50 },
      })
    )
  );

  // ── Users ─────────────────────────────────────────────────────────────────
  const pw = await hash("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@medisupply.ph" },
    update: {},
    create: { email: "admin@medisupply.ph", name: "Admin User", passwordHash: pw, role: "ADMIN" as Role },
  });

  await prisma.user.upsert({
    where: { email: "finance@medisupply.ph" },
    update: {},
    create: { email: "finance@medisupply.ph", name: "Finance Officer", passwordHash: pw, role: "FINANCE" as Role },
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

  // Customer user
  const custUser = await prisma.user.upsert({
    where: { email: "procurement@stlukes.com.ph" },
    update: {},
    create: {
      email: "procurement@stlukes.com.ph",
      name: "St. Luke's Procurement",
      passwordHash: pw,
      role: "CUSTOMER" as Role,
      customerId: customers[0].id,
    },
  });

  // Technician
  const tech = await prisma.technician.upsert({
    where: { id: "TECH-001" },
    update: {},
    create: { id: "TECH-001", name: "Juan dela Cruz", specialization: "Biomedical Equipment" },
  });

  await prisma.user.upsert({
    where: { email: "tech@medisupply.ph" },
    update: {},
    create: {
      email: "tech@medisupply.ph",
      name: "Juan dela Cruz",
      passwordHash: pw,
      role: "TECHNICIAN" as Role,
      technicianId: tech.id,
    },
  });

  // ── Assets ────────────────────────────────────────────────────────────────
  const assets = await Promise.all(
    [
      { id: "ASSET-001", name: "Ventilator ICU-01",     serialNumber: "MR-VNT-2022-001", category: "VENTILATOR"   as AssetCategory },
      { id: "ASSET-002", name: "Patient Monitor PM-02", serialNumber: "MR-MON-2021-002", category: "MONITOR"      as AssetCategory },
      { id: "ASSET-003", name: "Defibrillator AED-01",  serialNumber: "ZL-AED-2023-001", category: "DEFIBRILLATOR"as AssetCategory },
    ].map((a) =>
      prisma.asset.upsert({
        where: { id: a.id },
        update: {},
        create: { ...a, warehouseId: wh1.id, purchasedAt: new Date("2022-01-15"), maintenanceIntervalDays: 90 },
      })
    )
  );

  // ── Sample orders ─────────────────────────────────────────────────────────
  const sampleOrders = [
    {
      id: "SO-2025-0001", customerId: customers[0].id, warehouseId: wh1.id, agentId: adminUser.id,
      subtotal: 960, vat: 115.2, cwt: 0, total: 1075.2, cwt2307: false, state: "DELIVERED" as const,
      lines: [{ skuId: "SKU-SYR-100", qty: 2, unitPrice: 480, lineTotal: 960 }],
    },
    {
      id: "SO-2025-0002", customerId: customers[1].id, warehouseId: wh1.id, agentId: adminUser.id,
      subtotal: 850000, vat: 102000, cwt: 17000, total: 935000, cwt2307: true, state: "PENDING" as const,
      lines: [{ skuId: "SKU-VENT-001", qty: 1, unitPrice: 850000, lineTotal: 850000 }],
    },
    {
      id: "SO-2025-0003", customerId: customers[2].id, warehouseId: wh1.id, agentId: adminUser.id,
      subtotal: 7600, vat: 912, cwt: 0, total: 8512, cwt2307: false, state: "APPROVED" as const,
      lines: [
        { skuId: "SKU-GLOVE-M", qty: 10, unitPrice: 380, lineTotal: 3800 },
        { skuId: "SKU-MASK-N95", qty: 3, unitPrice: 1200, lineTotal: 3600 },
        { skuId: "SKU-IV-500",   qty: 2, unitPrice: 85,   lineTotal: 170  },
      ],
    },
  ];

  for (const o of sampleOrders) {
    const { lines, ...orderData } = o;
    const existing = await prisma.order.findUnique({ where: { id: o.id } });
    if (!existing) {
      await prisma.order.create({
        data: {
          ...orderData,
          lines: { create: lines },
          events: { create: { state: orderData.state, actorId: adminUser.id, note: "Seeded" } },
        },
      });
    }
  }

  // ── Work orders ───────────────────────────────────────────────────────────
  const wos = [
    { id: "WO-2025-001", assetId: assets[0].id, technicianId: tech.id, type: "PREVENTIVE", status: "IN_PROGRESS" as const, priority: "HIGH" as const, title: "Q2 Preventive Maintenance — Ventilator ICU-01" },
    { id: "WO-2025-002", assetId: assets[1].id, technicianId: tech.id, type: "CORRECTIVE", status: "NEEDS_PARTS"  as const, priority: "URGENT" as const, title: "Screen calibration failure — PM-02" },
    { id: "WO-2025-003", assetId: assets[2].id, technicianId: tech.id, type: "PREVENTIVE", status: "PENDING"      as const, priority: "MEDIUM" as const, title: "Annual safety check — AED-01" },
  ];

  for (const wo of wos) {
    await prisma.workOrder.upsert({
      where: { id: wo.id },
      update: {},
      create: {
        ...wo,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
