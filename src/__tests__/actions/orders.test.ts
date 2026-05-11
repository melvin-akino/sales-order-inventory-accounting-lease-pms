/**
 * Action tests for order creation and state advancement.
 * Prisma and next-auth are mocked so no database is needed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks (hoisted before imports) ─────────────────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/email", () => ({ sendOrderEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/credit", () => ({
  getCustomerCredit: vi.fn().mockResolvedValue({
    creditLimit: 0,
    outstanding: 0,
    available: 0,
  }),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getCustomerCredit } from "@/lib/credit";

const mockSession = (role = "FINANCE") => ({
  user: { id: "user-1", name: "Test User", email: "test@test.com", role },
});

// ── createOrder ───────────────────────────────────────────────────────────────

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession() as any);

    // Seed the prisma mock with what createOrder calls
    (prisma as any).order = {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: "SO-2025-0001" }),
    };
    (prisma as any).catalogItem = {
      findMany: vi.fn().mockResolvedValue([
        { id: "SKU-1", name: "Amoxicillin 500mg", unit: "box" },
      ]),
    };
  });

  it("throws when user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { createOrder } = await import("@/app/(dashboard)/orders/actions");
    await expect(
      createOrder({ customerId: "c1", warehouseId: "w1", cwt2307: false, lines: [{ skuId: "SKU-1", qty: 1, unitPrice: 100 }] })
    ).rejects.toThrow("Unauthenticated");
  });

  it("creates an order and returns the order ID", async () => {
    const { createOrder } = await import("@/app/(dashboard)/orders/actions");
    const id = await createOrder({
      customerId: "c1",
      warehouseId: "w1",
      cwt2307: false,
      lines: [{ skuId: "SKU-1", qty: 2, unitPrice: 500 }],
    });
    expect(id).toBe("SO-2025-0001");
    expect((prisma as any).order.create).toHaveBeenCalledOnce();
  });

  it("throws CREDIT_LIMIT_WARNING when credit is exceeded and user has no override role", async () => {
    vi.mocked(getCustomerCredit).mockResolvedValue({
      creditLimit: 1000,
      outstanding: 900,
      available: 100,
    } as any);
    // AGENT cannot override credit
    vi.mocked(getServerSession).mockResolvedValue(mockSession("AGENT") as any);

    const { createOrder } = await import("@/app/(dashboard)/orders/actions");
    await expect(
      createOrder({ customerId: "c1", warehouseId: "w1", cwt2307: false, lines: [{ skuId: "SKU-1", qty: 1, unitPrice: 500 }] })
    ).rejects.toThrow("Credit limit exceeded");
  });

  it("throws CREDIT_LIMIT_WARNING for FINANCE when override flag is missing", async () => {
    vi.mocked(getCustomerCredit).mockResolvedValue({
      creditLimit: 1000,
      outstanding: 900,
      available: 100,
    } as any);
    vi.mocked(getServerSession).mockResolvedValue(mockSession("FINANCE") as any);

    const { createOrder } = await import("@/app/(dashboard)/orders/actions");
    await expect(
      createOrder({ customerId: "c1", warehouseId: "w1", cwt2307: false, lines: [{ skuId: "SKU-1", qty: 1, unitPrice: 500 }] })
    ).rejects.toThrow("CREDIT_LIMIT_WARNING");
  });

  it("succeeds for FINANCE when overrideCreditLimit is true", async () => {
    vi.mocked(getCustomerCredit).mockResolvedValue({
      creditLimit: 1000,
      outstanding: 900,
      available: 100,
    } as any);
    vi.mocked(getServerSession).mockResolvedValue(mockSession("FINANCE") as any);

    const { createOrder } = await import("@/app/(dashboard)/orders/actions");
    const id = await createOrder({
      customerId: "c1",
      warehouseId: "w1",
      cwt2307: false,
      overrideCreditLimit: true,
      lines: [{ skuId: "SKU-1", qty: 1, unitPrice: 500 }],
    });
    expect(id).toBe("SO-2025-0001");
  });
});

// ── advanceOrderState ─────────────────────────────────────────────────────────

describe("advanceOrderState", () => {
  const baseOrder = {
    id: "SO-2025-0001",
    state: "PENDING",
    warehouseId: "WH-1",
    customerId: "c1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession("FINANCE") as any);

    (prisma as any).order = {
      findUniqueOrThrow: vi.fn().mockResolvedValue(baseOrder),
      findUnique: vi.fn().mockResolvedValue({ ...baseOrder, state: "APPROVED", customer: { users: [] } }),
      update: vi.fn().mockResolvedValue({}),
    };
    (prisma as any).orderLine = {
      findMany: vi.fn().mockResolvedValue([{ skuId: "SKU-1", qty: 5, name: "Med" }]),
    };
    (prisma as any).stock = {
      findUnique: vi.fn().mockResolvedValue({ onHand: 100, reserved: 0 }),
      upsert: vi.fn().mockResolvedValue({}),
    };
    (prisma as any).orderEvent = { create: vi.fn().mockResolvedValue({}) };
    (prisma as any).$transaction = vi.fn().mockImplementation((ops: any) =>
      Array.isArray(ops) ? Promise.all(ops) : ops({} as any)
    );
  });

  it("throws when user is unauthenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { advanceOrderState } = await import("@/app/(dashboard)/orders/actions");
    await expect(advanceOrderState("SO-2025-0001")).rejects.toThrow("Unauthenticated");
  });

  it("throws Forbidden when role cannot advance the current state", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession("WAREHOUSE") as any);
    const { advanceOrderState } = await import("@/app/(dashboard)/orders/actions");
    // WAREHOUSE cannot approve (PENDING→APPROVED)
    await expect(advanceOrderState("SO-2025-0001")).rejects.toThrow("Forbidden");
  });

  it("reserves stock when advancing to APPROVED", async () => {
    const { advanceOrderState } = await import("@/app/(dashboard)/orders/actions");
    await advanceOrderState("SO-2025-0001");
    expect((prisma as any).stock.upsert).toHaveBeenCalled();
  });

  it("throws insufficient stock error when stock is too low", async () => {
    (prisma as any).stock.findUnique = vi.fn().mockResolvedValue({ onHand: 2, reserved: 0 });
    const { advanceOrderState } = await import("@/app/(dashboard)/orders/actions");
    await expect(advanceOrderState("SO-2025-0001")).rejects.toThrow("Insufficient stock");
  });
});

// ── cancelOrder ───────────────────────────────────────────────────────────────

describe("cancelOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession("ADMIN") as any);

    (prisma as any).order = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "SO-1", state: "PENDING", warehouseId: "WH-1" }),
      update: vi.fn().mockResolvedValue({}),
    };
    (prisma as any).orderLine = { findMany: vi.fn().mockResolvedValue([]) };
    (prisma as any).stock = { updateMany: vi.fn().mockResolvedValue({}) };
    (prisma as any).orderEvent = { create: vi.fn().mockResolvedValue({}) };
    (prisma as any).$transaction = vi.fn().mockImplementation((ops: any) =>
      Array.isArray(ops) ? Promise.all(ops) : ops({} as any)
    );
  });

  it("cancels a PENDING order without releasing stock (not yet reserved)", async () => {
    const { cancelOrder } = await import("@/app/(dashboard)/orders/actions");
    await cancelOrder("SO-1", "Wrong address");
    expect((prisma as any).stock.updateMany).not.toHaveBeenCalled();
  });

  it("releases stock when cancelling an APPROVED order", async () => {
    (prisma as any).order.findUniqueOrThrow = vi.fn().mockResolvedValue({
      id: "SO-1", state: "APPROVED", warehouseId: "WH-1",
    });
    (prisma as any).orderLine.findMany = vi.fn().mockResolvedValue([
      { skuId: "SKU-1", qty: 5 },
    ]);
    const { cancelOrder } = await import("@/app/(dashboard)/orders/actions");
    await cancelOrder("SO-1", "Customer request");
    expect((prisma as any).stock.updateMany).toHaveBeenCalled();
  });

  it("throws when trying to cancel a DELIVERED order", async () => {
    (prisma as any).order.findUniqueOrThrow = vi.fn().mockResolvedValue({
      id: "SO-1", state: "DELIVERED", warehouseId: "WH-1",
    });
    const { cancelOrder } = await import("@/app/(dashboard)/orders/actions");
    await expect(cancelOrder("SO-1", "Mistake")).rejects.toThrow("Cannot cancel");
  });
});
