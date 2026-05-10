"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOrder, getCustomerCredit } from "../actions";
import { useToast } from "@/components/ui/Toast";
import { peso, orderTotal } from "@/lib/utils";
import type { Customer, CatalogItem, Warehouse } from "@prisma/client";
import type { CreditStatus } from "@/lib/credit";

interface Props {
  customers: Customer[];
  catalog: CatalogItem[];
  warehouses: Warehouse[];
  fixedCustomerId?: string;  // set for CUSTOMER role
  backHref?: string;
}

interface Line { skuId: string; qty: number; unitPrice: number }

function CreditBar({ credit, orderTotal, onOverride, overridden }: {
  credit: CreditStatus; orderTotal: number;
  onOverride: (v: boolean) => void; overridden: boolean;
}) {
  const projectedUtil = credit.creditLimit > 0
    ? Math.min(((credit.outstanding + orderTotal) / credit.creditLimit) * 100, 100)
    : 0;
  const isOver = credit.outstanding + orderTotal > credit.creditLimit;
  const barColor = isOver ? "#dc2626" : projectedUtil > 75 ? "#d97706" : "#16a34a";

  return (
    <div style={{ padding: "10px 14px", borderRadius: 7, border: `1px solid ${isOver ? "#fecaca" : "#e5e7eb"}`, background: isOver ? "#fef2f2" : "oklch(var(--bg-2))" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: isOver ? "#dc2626" : "oklch(var(--ink-2))" }}>
          {isOver ? "⚠ Credit limit exceeded" : "Credit utilization"}
        </span>
        <span style={{ fontSize: 11, fontFamily: "monospace", color: "oklch(var(--ink-3))" }}>
          {peso(credit.outstanding + orderTotal)} / {peso(credit.creditLimit)}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "oklch(var(--line))", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${projectedUtil}%`, background: barColor, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "oklch(var(--ink-3))" }}>
        <span>Outstanding AR: {peso(credit.outstanding)}</span>
        <span>Available: {peso(Math.max(0, credit.available))}</span>
      </div>
      {isOver && (
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={overridden} onChange={e => onOverride(e.target.checked)} />
          <span style={{ color: "#dc2626", fontWeight: 500 }}>Override credit limit (Finance/Admin only)</span>
        </label>
      )}
    </div>
  );
}

export function NewOrderForm({ customers, catalog, warehouses, fixedCustomerId, backHref = "/orders" }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [customerId, setCustomerId] = useState(fixedCustomerId ?? "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [cwt2307, setCwt2307] = useState(false);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ skuId: "", qty: 1, unitPrice: 0 }]);
  const [credit, setCredit] = useState<CreditStatus | null>(null);
  const [creditOverride, setCreditOverride] = useState(false);

  // Fetch credit status whenever customer changes
  useEffect(() => {
    setCreditOverride(false);
    setCredit(null);
    if (!customerId) return;
    getCustomerCredit(customerId).then(setCredit).catch(() => {});
  }, [customerId]);

  function addLine() { setLines(l => [...l, { skuId: "", qty: 1, unitPrice: 0 }]); }
  function removeLine(i: number) { setLines(l => l.filter((_, idx) => idx !== i)); }

  function updateLine(i: number, field: keyof Line, value: string | number) {
    setLines(prev => {
      const next = [...prev];
      if (field === "skuId") {
        const item = catalog.find(c => c.id === value);
        next[i] = { ...next[i], skuId: value as string, unitPrice: item ? Number(item.unitPrice) : 0 };
      } else {
        next[i] = { ...next[i], [field]: Number(value) };
      }
      return next;
    });
  }

  const subtotal = lines.reduce((s, l) => s + (l.qty || 0) * (l.unitPrice || 0), 0);
  const { vat, cwt, total } = orderTotal(subtotal, cwt2307);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !warehouseId) { toast("Select customer and warehouse", "error"); return; }
    if (lines.some(l => !l.skuId || l.qty < 1 || l.unitPrice <= 0)) {
      toast("Complete all line items", "error"); return;
    }

    startTransition(async () => {
      try {
        const id = await createOrder({ customerId, warehouseId, cwt2307, notes, lines, overrideCreditLimit: creditOverride });
        toast(`Order ${id} created`, "success");
        router.push(`/orders/${id}`);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.startsWith("CREDIT_LIMIT_WARNING:")) {
          const available = msg.split(":")[1];
          toast(`Over credit limit (available: ${available}). Check the override box to proceed.`, "error");
          return;
        }
        toast(msg, "error");
      }
    });
  }

  const fixedCustomerName = fixedCustomerId ? customers[0]?.name : undefined;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="card">
        <div className="card-head"><span className="card-h">Order Details</span></div>
        <div className="card-body grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label className="field-label">Customer</label>
            {fixedCustomerName ? (
              <div className="field-input" style={{ display:"flex", alignItems:"center", background:"oklch(var(--bg-2))", color:"oklch(var(--ink))", cursor:"not-allowed" }}>
                {fixedCustomerName}
              </div>
            ) : (
              <select className="field-input" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="field-label">Warehouse</label>
            <select className="field-input" value={warehouseId} onChange={e => setWarehouseId(e.target.value)} required>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          {/* Credit limit bar */}
          {credit && credit.creditLimit > 0 && (
            <div className="col-span-2">
              <CreditBar credit={credit} orderTotal={total} onOverride={setCreditOverride} overridden={creditOverride} />
            </div>
          )}

          <div className="col-span-2">
            <label className="field-label">Notes</label>
            <textarea className="field-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions or delivery notes…" />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="cwt" checked={cwt2307} onChange={e => setCwt2307(e.target.checked)} className="w-3.5 h-3.5" />
            <label htmlFor="cwt" className="text-[12.5px]" style={{ color:"oklch(var(--ink-2))" }}>
              Apply BIR Form 2307 — Creditable Withholding Tax (−2%)
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-h flex-1">Line Items</span>
          <button type="button" onClick={addLine} className="btn btn-sm">+ Add line</button>
        </div>
        <div className="tbl-wrap" style={{ border:0, borderRadius:0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th className="num" style={{ width:80 }}>Qty</th>
                <th className="num" style={{ width:130 }}>Unit Price</th>
                <th className="num" style={{ width:130 }}>Line Total</th>
                <th style={{ width:40 }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} style={{ cursor:"default" }}>
                  <td>
                    <select className="field-input" value={line.skuId} onChange={e => updateLine(i, "skuId", e.target.value)} required>
                      <option value="">Select product…</option>
                      {catalog.map(c => <option key={c.id} value={c.id}>{c.name} ({c.sku})</option>)}
                    </select>
                  </td>
                  <td className="num">
                    <input type="number" min={1} className="field-input text-right" value={line.qty} onChange={e => updateLine(i, "qty", e.target.value)} required />
                  </td>
                  <td className="num">
                    <input type="number" min={0} step={0.01} className="field-input text-right" value={line.unitPrice} onChange={e => updateLine(i, "unitPrice", e.target.value)} required />
                  </td>
                  <td className="num">{peso(line.qty * line.unitPrice)}</td>
                  <td>
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="btn btn-ghost btn-sm btn-danger">✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-body border-t" style={{ borderColor:"oklch(var(--line))" }}>
          <div className="ledger">
            <div className="ledger-row"><span>Subtotal</span><span></span><span>{peso(subtotal)}</span></div>
            <div className="ledger-row"><span className="ledger-row-cr">VAT (12%)</span><span></span><span>{peso(vat)}</span></div>
            {cwt2307 && <div className="ledger-row"><span className="ledger-row-cr">CWT 2307 (−2%)</span><span></span><span>({peso(cwt)})</span></div>}
            <div className="ledger-row ledger-row-total"><span>Total</span><span></span><span>{peso(total)}</span></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.push(backHref)} className="btn">Cancel</button>
        <button type="submit" disabled={isPending} className="btn btn-accent">
          {isPending ? "Creating…" : "Create Order"}
        </button>
      </div>
    </form>
  );
}
