"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { JeSource } from "@prisma/client";

function jeId() {
  return "JE-" + randomUUID().slice(0, 8).toUpperCase();
}

function parseDays(terms: string): number {
  const m = terms.match(/\d+/);
  return m ? parseInt(m[0]) : 30;
}

// ── Create manual journal entry ──────────────────────────────────────────────

export async function createJournalEntry(data: {
  date: string;
  source: JeSource;
  ref?: string;
  memo: string;
  lines: { code: string; dr: number; cr: number }[];
}): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const totalDr = data.lines.reduce((s, l) => s + l.dr, 0);
  const totalCr = data.lines.reduce((s, l) => s + l.cr, 0);
  if (Math.abs(totalDr - totalCr) > 0.01) {
    return { error: `Journal entry is not balanced (DR ${totalDr.toFixed(2)} ≠ CR ${totalCr.toFixed(2)})` };
  }
  if (data.lines.length < 2) {
    return { error: "At least two lines are required." };
  }

  try {
    await prisma.journalEntry.create({
      data: {
        id: jeId(),
        date: new Date(data.date),
        source: data.source,
        ref: data.ref || null,
        memo: data.memo,
        postedById: session.user.id,
        lines: {
          create: data.lines.map((l) => ({ code: l.code, dr: l.dr, cr: l.cr })),
        },
      },
    });
    revalidatePath("/ledger");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Failed to save journal entry." };
  }
}

// ── Record invoice payment (AR) ──────────────────────────────────────────────

export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  try {
    const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    const newPaid = Number(inv.paid) + amount;
    const balance = Number(inv.amount) - newPaid;
    const status = balance <= 0.01 ? "PAID" : "PARTIAL";

    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { paid: newPaid, status },
      }),
      prisma.journalEntry.create({
        data: {
          id: jeId(),
          date: new Date(),
          source: "BANK",
          ref: invoiceId,
          memo: `Payment received — ${inv.id}`,
          postedById: session.user.id,
          lines: {
            create: [
              { code: "1010", dr: amount, cr: 0 },
              { code: "1100", dr: 0, cr: amount },
            ],
          },
        },
      }),
    ]);

    revalidatePath("/ledger");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Failed to record payment." };
  }
}

// ── Record bill payment (AP) ─────────────────────────────────────────────────

export async function recordBillPayment(
  billId: string,
  amount: number,
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  try {
    const bill = await prisma.bill.findUniqueOrThrow({ where: { id: billId } });
    const newPaid = Number(bill.paid) + amount;
    const balance = Number(bill.amount) - newPaid;
    const status = balance <= 0.01 ? "PAID" : "PARTIAL";

    await prisma.$transaction([
      prisma.bill.update({
        where: { id: billId },
        data: { paid: newPaid, status },
      }),
      prisma.journalEntry.create({
        data: {
          id: jeId(),
          date: new Date(),
          source: "BANK",
          ref: billId,
          memo: `Bill payment — ${bill.id}`,
          postedById: session.user.id,
          lines: {
            create: [
              { code: "2000", dr: amount, cr: 0 },
              { code: "1010", dr: 0, cr: amount },
            ],
          },
        },
      }),
    ]);

    revalidatePath("/ledger");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Failed to record bill payment." };
  }
}

// ── Mark BIR filing as filed ─────────────────────────────────────────────────

export async function markBirFiled(
  filingId: string,
  refNo: string,
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  try {
    await prisma.birFiling.update({
      where: { id: filingId },
      data: { status: "FILED", desc: refNo || undefined },
    });
    revalidatePath("/ledger");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Failed to update filing." };
  }
}

// ── Generate invoice from Sales Order ────────────────────────────────────────

export async function generateInvoiceFromOrder(
  soId: string,
): Promise<{ error?: string; invoiceId?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  try {
    const existing = await prisma.invoice.findFirst({ where: { soId } });
    if (existing) return { error: "An invoice already exists for this order.", invoiceId: existing.id };

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: soId },
      include: { customer: true },
    });

    const issued = new Date();
    const due = new Date(issued);
    due.setDate(due.getDate() + parseDays(order.customer.terms));

    const invId = "INV-" + randomUUID().slice(0, 8).toUpperCase();
    const total = Number(order.total);
    const vatPortion = total * (12 / 112);
    const revPortion = total - vatPortion;

    await prisma.$transaction([
      prisma.invoice.create({
        data: {
          id: invId,
          customerId: order.customerId,
          soId,
          issued,
          due,
          amount: total,
          paid: 0,
          status: "OPEN",
        },
      }),
      prisma.journalEntry.create({
        data: {
          id: jeId(),
          date: issued,
          source: "AR",
          ref: soId,
          memo: `Invoice ${invId} — ${order.customer.name}`,
          postedById: session.user.id,
          lines: {
            create: [
              { code: "1100", dr: total,       cr: 0          },
              { code: "4000", dr: 0,            cr: revPortion },
              { code: "2100", dr: 0,            cr: vatPortion },
            ],
          },
        },
      }),
    ]);

    revalidatePath("/ledger");
    revalidatePath(`/orders/${soId}`);
    return { invoiceId: invId };
  } catch (e) {
    console.error(e);
    return { error: "Failed to generate invoice." };
  }
}
