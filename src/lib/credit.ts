import { prisma } from "@/lib/prisma";

export interface CreditStatus {
  creditLimit: number;
  outstanding: number;  // sum of unpaid invoice balances
  available: number;    // creditLimit - outstanding
  utilPct: number;      // 0–100+
  overLimit: boolean;
}

export async function getCustomerCredit(customerId: string): Promise<CreditStatus> {
  const [customer, invoices] = await Promise.all([
    prisma.customer.findUniqueOrThrow({ where: { id: customerId }, select: { creditLimit: true } }),
    prisma.invoice.findMany({
      where: { customerId, status: { notIn: ["PAID"] } },
      select: { amount: true, paid: true },
    }),
  ]);

  const creditLimit = Number(customer.creditLimit);
  const outstanding = invoices.reduce((s, i) => s + Number(i.amount) - Number(i.paid), 0);
  const available = creditLimit - outstanding;
  const utilPct = creditLimit > 0 ? (outstanding / creditLimit) * 100 : 0;

  return { creditLimit, outstanding, available, utilPct, overLimit: outstanding > creditLimit };
}
