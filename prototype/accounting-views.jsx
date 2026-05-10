// accounting-views.jsx — Full accounting module for ChartCare ERP

// ─── Chart of Accounts (PH-flavored) ────────────────────────────────────────
const COA = [
  // Assets
  { code: "1000", name: "Cash on Hand",                      type: "ASSET",     normal: "DR" },
  { code: "1010", name: "Cash in Bank — BPI Operating",      type: "ASSET",     normal: "DR" },
  { code: "1020", name: "Cash in Bank — Metrobank Payroll",  type: "ASSET",     normal: "DR" },
  { code: "1100", name: "Accounts Receivable — Trade",       type: "ASSET",     normal: "DR" },
  { code: "1110", name: "Allowance for Doubtful Accounts",   type: "ASSET",     normal: "CR" },
  { code: "1150", name: "Withholding Tax Receivable (CWT 2307)", type: "ASSET", normal: "DR" },
  { code: "1200", name: "Inventory — MNL",                   type: "ASSET",     normal: "DR" },
  { code: "1210", name: "Inventory — CEB",                   type: "ASSET",     normal: "DR" },
  { code: "1220", name: "Inventory — DVO",                   type: "ASSET",     normal: "DR" },
  { code: "1300", name: "Prepaid Expenses",                  type: "ASSET",     normal: "DR" },
  { code: "1500", name: "Property, Plant & Equipment",       type: "ASSET",     normal: "DR" },
  { code: "1510", name: "Accumulated Depreciation",          type: "ASSET",     normal: "CR" },
  // Liabilities
  { code: "2000", name: "Accounts Payable — Trade",          type: "LIABILITY", normal: "CR" },
  { code: "2100", name: "Output VAT Payable",                type: "LIABILITY", normal: "CR" },
  { code: "2110", name: "Input VAT",                         type: "LIABILITY", normal: "DR" },
  { code: "2150", name: "Withholding Tax Payable (1601-EQ)", type: "LIABILITY", normal: "CR" },
  { code: "2160", name: "Withholding Tax Payable (1601-C Compensation)", type: "LIABILITY", normal: "CR" },
  { code: "2200", name: "SSS Payable",                       type: "LIABILITY", normal: "CR" },
  { code: "2210", name: "PhilHealth Payable",                type: "LIABILITY", normal: "CR" },
  { code: "2220", name: "Pag-IBIG Payable",                  type: "LIABILITY", normal: "CR" },
  { code: "2300", name: "Customer Deposits",                 type: "LIABILITY", normal: "CR" },
  // Equity
  { code: "3000", name: "Owner's Capital",                   type: "EQUITY",    normal: "CR" },
  { code: "3100", name: "Retained Earnings",                 type: "EQUITY",    normal: "CR" },
  // Revenue
  { code: "4000", name: "Sales Revenue",                     type: "REVENUE",   normal: "CR" },
  { code: "4100", name: "Lease Revenue",                     type: "REVENUE",   normal: "CR" },
  { code: "4200", name: "Service Revenue (PMS)",             type: "REVENUE",   normal: "CR" },
  { code: "4900", name: "Sales Returns & Allowances",        type: "REVENUE",   normal: "DR" },
  // Expenses
  { code: "5000", name: "Cost of Goods Sold",                type: "EXPENSE",   normal: "DR" },
  { code: "5100", name: "Salaries & Wages",                  type: "EXPENSE",   normal: "DR" },
  { code: "5200", name: "Rent Expense",                      type: "EXPENSE",   normal: "DR" },
  { code: "5300", name: "Utilities",                         type: "EXPENSE",   normal: "DR" },
  { code: "5400", name: "Freight & Logistics",               type: "EXPENSE",   normal: "DR" },
  { code: "5500", name: "Depreciation Expense",              type: "EXPENSE",   normal: "DR" },
  { code: "5600", name: "Bad Debt Expense",                  type: "EXPENSE",   normal: "DR" },
  { code: "5700", name: "Bank Charges",                      type: "EXPENSE",   normal: "DR" },
];
const acctByCode = (code) => COA.find((a) => a.code === code);

// ─── Journal entries (synthetic) ────────────────────────────────────────────
const JOURNAL = [
  { id: "JE-2026-04-0418", date: hoursAgo(0.4), source: "AR", ref: "INV-2026-0418", memo: "Sale to St. Luke's QC",
    by: "F. Villanueva", lines: [ { code: "1100", dr: 312480 }, { code: "4000", cr: 279000 }, { code: "2100", cr: 33480 }, { code: "5000", dr: 124200 }, { code: "1200", cr: 124200 } ] },
  { id: "JE-2026-04-0417", date: hoursAgo(2),  source: "AR", ref: "INV-2026-0417", memo: "Sale to Makati Med",
    by: "F. Villanueva", lines: [ { code: "1100", dr: 184800 }, { code: "4000", cr: 165000 }, { code: "2100", cr: 19800 }, { code: "5000", dr: 73000 }, { code: "1200", cr: 73000 } ] },
  { id: "JE-2026-04-0416", date: hoursAgo(8),  source: "AP", ref: "PO-2026-0294", memo: "PO receipt — Apex Devices",
    by: "F. Villanueva", lines: [ { code: "1500", dr: 750000 }, { code: "2110", dr: 90000 }, { code: "2000", cr: 825000 }, { code: "2150", cr: 15000 } ] },
  { id: "JE-2026-04-0415", date: hoursAgo(20), source: "BANK", ref: "BPI-CK-1142", memo: "Payment received — Davao Doctors Hospital",
    by: "F. Villanueva", lines: [ { code: "1010", dr: 268320 }, { code: "1150", dr: 5364 }, { code: "1100", cr: 273684 } ] },
  { id: "JE-2026-04-0414", date: hoursAgo(26), source: "INV", ref: "TR-0034", memo: "Inter-warehouse transfer MNL→CEB",
    by: "S. Tan", lines: [ { code: "1210", dr: 73000 }, { code: "1200", cr: 73000 } ] },
  { id: "JE-2026-04-0413", date: hoursAgo(30), source: "AR", ref: "INV-2026-0414", memo: "Sale to CDU Hospital — shipped",
    by: "F. Villanueva", lines: [ { code: "1100", dr: 92400 }, { code: "4000", cr: 82500 }, { code: "2100", cr: 9900 }, { code: "5000", dr: 36900 }, { code: "1210", cr: 36900 } ] },
  { id: "JE-2026-04-0412", date: hoursAgo(38), source: "PAYROLL", ref: "PAY-2026-04-30", memo: "Bi-monthly payroll · 60 employees",
    by: "F. Villanueva", lines: [ { code: "5100", dr: 1820000 }, { code: "1020", cr: 1488800 }, { code: "2160", cr: 196000 }, { code: "2200", cr: 78400 }, { code: "2210", cr: 32200 }, { code: "2220", cr: 24600 } ] },
  { id: "JE-2026-04-0411", date: hoursAgo(48), source: "AP", ref: "BILL-MERALCO-04", memo: "Meralco — April",
    by: "F. Villanueva", lines: [ { code: "5300", dr: 187500 }, { code: "2110", dr: 22500 }, { code: "2000", cr: 210000 } ] },
  { id: "JE-2026-04-0410", date: hoursAgo(56), source: "AP", ref: "BILL-MAYNILAD-04", memo: "Maynilad water — April",
    by: "F. Villanueva", lines: [ { code: "5300", dr: 38400 }, { code: "2110", dr: 4608 }, { code: "2000", cr: 43008 } ] },
  { id: "JE-2026-04-0409", date: hoursAgo(72), source: "BANK", ref: "BPI-CK-1141", memo: "Payment received — IMH",
    by: "F. Villanueva", lines: [ { code: "1010", dr: 64680 }, { code: "1100", cr: 64680 } ] },
  { id: "JE-2026-04-0408", date: hoursAgo(96), source: "AP", ref: "PO-2026-0297", memo: "PO receipt — Pacific Health",
    by: "F. Villanueva", lines: [ { code: "1210", dr: 171428 }, { code: "2110", dr: 20571 }, { code: "2000", cr: 192000 } ] },
  { id: "JE-2026-04-0407", date: daysAgo(5),  source: "GL", ref: "DEPR-2026-04", memo: "Monthly depreciation — equipment",
    by: "F. Villanueva", lines: [ { code: "5500", dr: 142000 }, { code: "1510", cr: 142000 } ] },
  { id: "JE-2026-04-0406", date: daysAgo(8),  source: "AR", ref: "INV-2026-0413", memo: "Sale to Davao Doctors — delivered",
    by: "F. Villanueva", lines: [ { code: "1100", dr: 273684 }, { code: "4000", cr: 244343 }, { code: "2100", cr: 29321 }, { code: "1150", cr: 4886 }, { code: "5000", dr: 108000 }, { code: "1220", cr: 108000 } ] },
  { id: "JE-2026-04-0405", date: daysAgo(12), source: "GL", ref: "ADJ-RENT-04", memo: "Reclass prepaid rent April",
    by: "F. Villanueva", lines: [ { code: "5200", dr: 240000 }, { code: "1300", cr: 240000 } ] },
];

// Compute balances
function trialBalance(asOf) {
  const cutoff = asOf ? new Date(asOf).getTime() : Date.now();
  const bal = {};
  COA.forEach((a) => { bal[a.code] = 0; });
  // Opening balances (synthetic)
  const opening = {
    "1000": 850000, "1010": 8420000, "1020": 1240000, "1100": 4280000,
    "1110": -180000, "1200": 6800000, "1210": 2150000, "1220": 1280000,
    "1300": 720000, "1500": 14200000, "1510": -3680000,
    "2000": -2400000, "2100": -540000, "2110": 320000, "2150": -180000,
    "2160": -240000, "2200": -98000, "2210": -42000, "2220": -32000,
    "2300": -180000,
    "3000": -16000000, "3100": -8800000,
    "4000": -28400000, "4100": -2200000, "4200": -1800000, "4900": 220000,
    "5000": 11800000, "5100": 8400000, "5200": 1080000, "5300": 920000,
    "5400": 480000, "5500": 624000, "5600": 80000, "5700": 38000,
  };
  Object.entries(opening).forEach(([c, v]) => { bal[c] = v; });
  // Apply journal lines
  JOURNAL.forEach((j) => {
    if (new Date(j.date).getTime() > cutoff) return;
    j.lines.forEach((l) => {
      if (l.dr) bal[l.code] = (bal[l.code] || 0) + l.dr;
      if (l.cr) bal[l.code] = (bal[l.code] || 0) - l.cr;
    });
  });
  return bal;
}

// ─── AR Invoices ────────────────────────────────────────────────────────────
const INVOICES = [
  { id: "INV-2026-0418", customerId: "C-1042", soId: "SO-2026-0418", issued: hoursAgo(0.4), due: daysAgo(-30), amount: 312480, paid: 0,      status: "DRAFT" },
  { id: "INV-2026-0417", customerId: "C-1187", soId: "SO-2026-0417", issued: hoursAgo(2),   due: daysAgo(-30), amount: 184800, paid: 0,      status: "OPEN" },
  { id: "INV-2026-0416", customerId: "C-1455", soId: "SO-2026-0416", issued: daysAgo(2),    due: daysAgo(-28), amount: 156800, paid: 0,      status: "OPEN" },
  { id: "INV-2026-0415", customerId: "C-1318", soId: "SO-2026-0415", issued: daysAgo(7),    due: daysAgo(-23), amount: 220500, paid: 80000,  status: "PARTIAL" },
  { id: "INV-2026-0414", customerId: "C-1318", soId: "SO-2026-0414", issued: daysAgo(2),    due: daysAgo(-28), amount: 92400,  paid: 0,      status: "OPEN" },
  { id: "INV-2026-0413", customerId: "C-1402", soId: "SO-2026-0413", issued: daysAgo(8),    due: daysAgo(-22), amount: 273684, paid: 273684, status: "PAID" },
  { id: "INV-2026-0412", customerId: "C-1577", soId: "SO-2026-0412", issued: daysAgo(12),   due: daysAgo(-18), amount: 64680,  paid: 64680,  status: "PAID" },
  { id: "INV-2026-0411", customerId: "C-1042", soId: "SO-2026-0410", issued: daysAgo(35),   due: daysAgo(5),   amount: 489000, paid: 0,      status: "OVERDUE" },
  { id: "INV-2026-0410", customerId: "C-1187", soId: "SO-2026-0409", issued: daysAgo(48),   due: daysAgo(18),  amount: 178400, paid: 0,      status: "OVERDUE" },
  { id: "INV-2026-0409", customerId: "C-1501", soId: "SO-2026-0408", issued: daysAgo(62),   due: daysAgo(32),  amount: 248000, paid: 0,      status: "OVERDUE" },
  { id: "INV-2026-0408", customerId: "C-1455", soId: "SO-2026-0407", issued: daysAgo(78),   due: daysAgo(48),  amount: 92400,  paid: 0,      status: "OVERDUE" },
];

// ─── AP Bills ───────────────────────────────────────────────────────────────
const BILLS = [
  { id: "BILL-2026-0211", supplierId: "SUP-101", ref: "PO-2026-0294", issued: hoursAgo(8),  due: daysAgo(-37), amount: 825000, paid: 0,       status: "OPEN" },
  { id: "BILL-MERALCO-04", supplierId: null, vendor: "Meralco",     issued: hoursAgo(48), due: daysAgo(-10), amount: 210000, paid: 0,       status: "OPEN", note: "April electricity · WH-MNL + HQ" },
  { id: "BILL-MAYNILAD-04", supplierId: null, vendor: "Maynilad",   issued: hoursAgo(56), due: daysAgo(-12), amount: 43008,  paid: 0,       status: "OPEN", note: "April water · WH-MNL" },
  { id: "BILL-2026-0210", supplierId: "SUP-102", ref: "PO-2026-0297", issued: hoursAgo(96), due: daysAgo(-22), amount: 192000, paid: 0,       status: "OPEN" },
  { id: "BILL-2026-0209", supplierId: "SUP-104", ref: "PO-2026-0291", issued: daysAgo(8),   due: daysAgo(7),   amount: 128000, paid: 0,       status: "OVERDUE" },
  { id: "BILL-2026-0208", supplierId: "SUP-103", ref: "PO-2026-0289", issued: daysAgo(15),  due: daysAgo(0),   amount: 98000,  paid: 0,       status: "DUE" },
  { id: "BILL-2026-0207", supplierId: "SUP-107", ref: "PO-2026-0287", issued: daysAgo(38),  due: daysAgo(8),   amount: 165000, paid: 100000,  status: "PARTIAL" },
  { id: "BILL-2026-0206", supplierId: "SUP-108", ref: "PO-2026-0285", issued: daysAgo(52),  due: daysAgo(22),  amount: 412000, paid: 412000,  status: "PAID" },
];

// ─── BIR Tax filings ────────────────────────────────────────────────────────
const BIR_FILINGS = [
  { id: "2550Q-2026Q1", form: "BIR 2550Q",  period: "2026 Q1", due: daysAgo(-16), amount: 482500, status: "DUE",      desc: "Quarterly VAT Return" },
  { id: "1601EQ-2026Q1", form: "BIR 1601-EQ", period: "2026 Q1", due: daysAgo(-22), amount: 168000, status: "DUE",      desc: "Quarterly EWT Remittance" },
  { id: "1601C-04-2026", form: "BIR 1601-C",  period: "Apr 2026", due: daysAgo(-1),  amount: 196000, status: "FILED",    desc: "Monthly Withholding on Compensation" },
  { id: "0619E-04-2026",  form: "BIR 0619-E", period: "Apr 2026", due: daysAgo(2),   amount: 56000,  status: "FILED",    desc: "Monthly EWT Remittance" },
  { id: "2550M-04-2026",  form: "BIR 2550M",  period: "Apr 2026", due: daysAgo(11),  amount: 158400, status: "FILED",    desc: "Monthly VAT Return" },
  { id: "1701Q-2026Q1",   form: "BIR 1701Q",  period: "2026 Q1", due: daysAgo(-50), amount: 0,      status: "PENDING",  desc: "Quarterly Income Tax Return" },
];

// ────────────────────────────────────────────────────────────────────────────
function AccountingView({ orders }) {
  const [tab, setTab] = React.useState("OVERVIEW");

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Accounting</h1>
          <div className="page-sub">General ledger · AR / AP · BIR compliance · {COA.length} accounts in chart</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Down /> Export GL</button>
          <button className="btn btn-sm"><Icon.Print /> Period close pack</button>
          <button className="btn btn-primary btn-sm"><Icon.Plus /> Manual journal entry</button>
        </div>
      </div>

      <div className="tabs">
        {[
          ["OVERVIEW",  "Overview"],
          ["JOURNAL",   "Journal"],
          ["LEDGER",    "General ledger"],
          ["AR",        "Receivables"],
          ["AP",        "Payables"],
          ["TRIAL",     "Trial balance"],
          ["STATEMENTS","Statements"],
          ["BIR",       "BIR filings"],
        ].map(([k, l]) => (
          <button key={k} className="tab" data-active={tab === k ? "1" : "0"} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "OVERVIEW"   && <AcctOverview />}
      {tab === "JOURNAL"    && <JournalTab />}
      {tab === "LEDGER"     && <GeneralLedgerTab />}
      {tab === "AR"         && <ReceivablesTab />}
      {tab === "AP"         && <PayablesTab />}
      {tab === "TRIAL"      && <TrialBalanceTab />}
      {tab === "STATEMENTS" && <StatementsTab />}
      {tab === "BIR"        && <BirTab />}
    </div>
  );
}

// ── Overview
function AcctOverview() {
  const tb = trialBalance();
  const cash = (tb["1000"] || 0) + (tb["1010"] || 0) + (tb["1020"] || 0);
  const ar = tb["1100"] || 0;
  const ap = -(tb["2000"] || 0);
  const inv = (tb["1200"] || 0) + (tb["1210"] || 0) + (tb["1220"] || 0);
  const revenue = -((tb["4000"] || 0) + (tb["4100"] || 0) + (tb["4200"] || 0));
  const cogs = tb["5000"] || 0;
  const opex = (tb["5100"] || 0) + (tb["5200"] || 0) + (tb["5300"] || 0) + (tb["5400"] || 0) + (tb["5500"] || 0) + (tb["5600"] || 0) + (tb["5700"] || 0);
  const grossMargin = revenue - cogs;
  const netIncome = grossMargin - opex;
  const arOverdue = INVOICES.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + (i.amount - i.paid), 0);
  const apOverdue = BILLS.filter((b) => b.status === "OVERDUE").reduce((s, b) => s + (b.amount - b.paid), 0);
  const birDue = BIR_FILINGS.filter((b) => b.status === "DUE").length;

  return (
    <div>
      <div className="stat-grid">
        <Stat label="Cash position" value={SHORT_PESO(cash)} trend="3 bank accounts" up />
        <Stat label="Net income (YTD)" value={SHORT_PESO(netIncome)} trend={`${(netIncome / revenue * 100).toFixed(1)}% margin`} up />
        <Stat label="Accounts receivable" value={SHORT_PESO(ar)} trend={arOverdue > 0 ? `${SHORT_PESO(arOverdue)} overdue` : "All current"} dn={arOverdue > 0} />
        <Stat label="Accounts payable" value={SHORT_PESO(ap)} trend={apOverdue > 0 ? `${SHORT_PESO(apOverdue)} overdue` : "All current"} dn={apOverdue > 0} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginTop: 4 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-h">P&L summary · YTD 2026</div>
            <div className="dim" style={{ fontSize: 12, marginLeft: "auto" }}>Through {fmtDate(new Date().toISOString())}</div>
          </div>
          <div className="card-body">
            <PLBar label="Revenue" value={revenue} max={revenue} color="oklch(0.55 0.13 145)" />
            <PLBar label="Cost of goods sold" value={cogs} max={revenue} color="oklch(0.55 0.14 25)" sign="-" />
            <div style={{ borderTop: "1px solid var(--line)", margin: "10px 0", paddingTop: 10 }}>
              <PLBar label="Gross margin" value={grossMargin} max={revenue} color="var(--ink)" emphasized />
            </div>
            <PLBar label="Operating expenses" value={opex} max={revenue} color="oklch(0.55 0.10 80)" sign="-" />
            <div style={{ borderTop: "1.5px solid var(--ink)", margin: "10px 0 0", paddingTop: 10 }}>
              <PLBar label="Net income" value={netIncome} max={revenue} color="var(--ink)" emphasized />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-h">Action items</div></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0 }}>
            <ActionItem icon={<Icon.Bell />} tone="warn" title={`${INVOICES.filter((i) => i.status === "OVERDUE").length} overdue invoices`} sub={`${SHORT_PESO(arOverdue)} past due — collections needed`} />
            <ActionItem icon={<Icon.Doc />} tone="info" title={`${birDue} BIR filings due this period`} sub="2550Q & 1601-EQ for Q1 2026" />
            <ActionItem icon={<Icon.Wallet />} tone="warn" title={`${BILLS.filter((b) => b.status === "OVERDUE").length} bills past due`} sub={`${SHORT_PESO(apOverdue)} — supplier follow-up`} />
            <ActionItem icon={<Icon.Edit />} tone="ok" title="April month-end ready to close" sub="All entries posted · awaiting review" />
            <ActionItem icon={<Icon.Doc />} tone="info" title="Q1 income tax estimate" sub="1701Q draft pending — due in 3 weeks" last />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }} className="card">
        <div className="card-head">
          <div className="card-h">Recent journal activity</div>
          <button className="btn-ghost btn btn-sm" style={{ marginLeft: "auto" }}>View all →</button>
        </div>
        <div className="table-wrap" style={{ borderTop: "1px solid var(--line)", margin: 0, borderRadius: 0 }}>
          <table className="tbl">
            <thead><tr><th>JE #</th><th>When</th><th>Source</th><th>Memo</th><th>Reference</th><th className="num">Debit</th><th className="num">Credit</th></tr></thead>
            <tbody>
              {JOURNAL.slice(0, 6).map((j) => {
                const sumDr = j.lines.reduce((s, l) => s + (l.dr || 0), 0);
                return (
                  <tr key={j.id}>
                    <td className="id">{j.id}</td>
                    <td>{fmtRel(j.date)}</td>
                    <td><SourceChip source={j.source} /></td>
                    <td>{j.memo}</td>
                    <td className="dim mono" style={{ fontSize: 12 }}>{j.ref}</td>
                    <td className="num">{PESO(sumDr)}</td>
                    <td className="num">{PESO(sumDr)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PLBar({ label, value, max, color, sign = "+", emphasized = false }) {
  const pct = max > 0 ? Math.abs(value) / max : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: emphasized ? 500 : 400 }}>{label}</span>
        <span className="mono" style={{ fontSize: 13, fontWeight: emphasized ? 600 : 500 }}>
          {sign === "-" ? "(" : ""}{PESO(value)}{sign === "-" ? ")" : ""}
        </span>
      </div>
      <div style={{ height: emphasized ? 6 : 4, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: color, opacity: emphasized ? 1 : 0.7 }} />
      </div>
    </div>
  );
}

function ActionItem({ icon, tone, title, sub, last }) {
  const tones = {
    warn: "oklch(0.55 0.14 25)",
    info: "oklch(0.55 0.14 240)",
    ok: "oklch(0.45 0.12 145)",
  };
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <div style={{ color: tones[tone], width: 16, height: 16, marginTop: 2 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div className="dim" style={{ fontSize: 12, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

function SourceChip({ source }) {
  const map = {
    AR:      { label: "AR",      bg: "oklch(0.95 0.03 145)", fg: "oklch(0.32 0.10 145)" },
    AP:      { label: "AP",      bg: "oklch(0.95 0.03 25)",  fg: "oklch(0.40 0.12 25)"  },
    BANK:    { label: "Bank",    bg: "oklch(0.95 0.03 240)", fg: "oklch(0.35 0.10 240)" },
    PAYROLL: { label: "Payroll", bg: "oklch(0.94 0.04 290)", fg: "oklch(0.36 0.12 290)" },
    INV:     { label: "Inv",     bg: "oklch(0.94 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
    GL:      { label: "GL",      bg: "oklch(0.94 0.01 250)", fg: "oklch(0.40 0.02 250)" },
  }[source] || { label: source, bg: "var(--bg-2)", fg: "var(--ink-2)" };
  return <span style={{ padding: "2px 7px", borderRadius: 3, fontSize: 11, background: map.bg, color: map.fg, fontWeight: 500, fontFamily: "var(--font-mono)" }}>{map.label}</span>;
}

// ── Journal
function JournalTab() {
  const [search, setSearch] = React.useState("");
  const [src, setSrc] = React.useState("ALL");
  const [open, setOpen] = React.useState(null);

  const sources = ["ALL", "AR", "AP", "BANK", "PAYROLL", "INV", "GL"];
  const filtered = JOURNAL.filter((j) => {
    if (src !== "ALL" && j.source !== src) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return j.id.toLowerCase().includes(s) || j.memo.toLowerCase().includes(s) || j.ref.toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="filters">
        <div className="search" style={{ width: 320 }}>
          <Icon.Search />
          <input placeholder="JE #, memo, or reference…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {sources.map((s) => (
          <button key={s} className="chip" data-on={src === s ? "1" : "0"} onClick={() => setSrc(s)}>{s === "ALL" ? "All sources" : s}</button>
        ))}
        <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>{filtered.length} entries</span>
      </div>

      <div className="stack gap-2">
        {filtered.map((j) => {
          const sumDr = j.lines.reduce((s, l) => s + (l.dr || 0), 0);
          const isOpen = open === j.id;
          return (
            <div key={j.id} className="je-card">
              <button className="je-head" onClick={() => setOpen(isOpen ? null : j.id)}>
                <span className="id">{j.id}</span>
                <SourceChip source={j.source} />
                <span style={{ fontWeight: 500, fontSize: 13 }}>{j.memo}</span>
                <span className="dim mono" style={{ fontSize: 11.5 }}>{j.ref}</span>
                <span style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center" }}>
                  <span className="dim" style={{ fontSize: 12 }}>{fmtRel(j.date)}</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{PESO(sumDr)}</span>
                  <span className="je-chevron" data-open={isOpen ? "1" : "0"}><Icon.Chevron /></span>
                </span>
              </button>
              {isOpen && (
                <div className="je-body">
                  <table className="tbl je-lines">
                    <thead><tr><th>Account</th><th>Name</th><th className="num">Debit</th><th className="num">Credit</th></tr></thead>
                    <tbody>
                      {j.lines.map((l, i) => {
                        const a = acctByCode(l.code);
                        return (
                          <tr key={i}>
                            <td className="id">{l.code}</td>
                            <td>{a?.name}</td>
                            <td className="num mono" style={{ color: l.dr ? "var(--fg)" : "var(--ink-4)" }}>{l.dr ? PESO(l.dr) : "—"}</td>
                            <td className="num mono" style={{ color: l.cr ? "var(--fg)" : "var(--ink-4)" }}>{l.cr ? PESO(l.cr) : "—"}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop: "1.5px solid var(--ink)" }}>
                        <td colSpan="2" style={{ fontWeight: 500 }}>Totals</td>
                        <td className="num mono" style={{ fontWeight: 600 }}>{PESO(sumDr)}</td>
                        <td className="num mono" style={{ fontWeight: 600 }}>{PESO(sumDr)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="je-foot">
                    <span className="dim" style={{ fontSize: 12 }}>Posted by {j.by} · {fmtDate(j.date)}</span>
                    <button className="btn-ghost btn btn-sm" style={{ marginLeft: "auto" }}><Icon.Edit /> Edit</button>
                    <button className="btn-ghost btn btn-sm">Reverse</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── General Ledger (per account)
function GeneralLedgerTab() {
  const [acct, setAcct] = React.useState("1100");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const types = ["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];
  const accts = COA.filter((a) => typeFilter === "ALL" || a.type === typeFilter);

  // Build account ledger (from JOURNAL + opening)
  const tb = trialBalance();
  const a = acctByCode(acct);
  const movements = [];
  JOURNAL.slice().reverse().forEach((j) => {
    j.lines.forEach((l) => {
      if (l.code === acct) movements.push({ ...j, dr: l.dr || 0, cr: l.cr || 0 });
    });
  });
  let running = (tb[acct] || 0) - movements.reduce((s, m) => s + (m.dr - m.cr), 0);
  const withRunning = movements.map((m) => { running += m.dr - m.cr; return { ...m, running }; });
  const ending = tb[acct] || 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
      <div className="card" style={{ padding: 0, height: "fit-content", maxHeight: 640, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
          <div className="card-h" style={{ marginBottom: 8 }}>Chart of accounts</div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {types.map((t) => (
              <button key={t} className="chip" data-on={typeFilter === t ? "1" : "0"} onClick={() => setTypeFilter(t)} style={{ fontSize: 10 }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {accts.map((x) => (
            <button key={x.code} className="coa-row" data-active={x.code === acct ? "1" : "0"} onClick={() => setAcct(x.code)}>
              <span className="mono" style={{ fontSize: 12 }}>{x.code}</span>
              <span style={{ fontSize: 12.5, flex: 1 }}>{x.name}</span>
              <span className="mono dim" style={{ fontSize: 11 }}>{PESO(tb[x.code] || 0)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-h">{a.code} · {a.name}</div>
            <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>{a.type} · normal balance: {a.normal}</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div className="dim" style={{ fontSize: 11 }}>Ending balance</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>{PESO(ending)}</div>
          </div>
        </div>
        <div className="table-wrap" style={{ margin: 0, borderTop: "1px solid var(--line)", borderRadius: 0 }}>
          <table className="tbl">
            <thead><tr><th>Date</th><th>JE #</th><th>Memo</th><th>Reference</th><th className="num">Debit</th><th className="num">Credit</th><th className="num">Running</th></tr></thead>
            <tbody>
              {withRunning.length === 0 && <tr><td colSpan="7"><div className="empty"><div className="empty-ic"><Icon.Doc /></div>No activity in period.</div></td></tr>}
              {withRunning.map((m, i) => (
                <tr key={m.id + "-" + i}>
                  <td>{fmtDate(m.date)}</td>
                  <td className="id">{m.id}</td>
                  <td>{m.memo}</td>
                  <td className="dim mono" style={{ fontSize: 11.5 }}>{m.ref}</td>
                  <td className="num mono" style={{ color: m.dr ? "var(--fg)" : "var(--ink-4)" }}>{m.dr ? PESO(m.dr) : "—"}</td>
                  <td className="num mono" style={{ color: m.cr ? "var(--fg)" : "var(--ink-4)" }}>{m.cr ? PESO(m.cr) : "—"}</td>
                  <td className="num mono" style={{ fontWeight: 500 }}>{PESO(m.running)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Receivables
function ReceivablesTab() {
  const [tab, setTab] = React.useState("OPEN");
  const [search, setSearch] = React.useState("");
  const counts = {
    ALL: INVOICES.length,
    OPEN: INVOICES.filter((i) => ["OPEN", "PARTIAL", "OVERDUE", "DRAFT"].includes(i.status)).length,
    OVERDUE: INVOICES.filter((i) => i.status === "OVERDUE").length,
    PAID: INVOICES.filter((i) => i.status === "PAID").length,
  };
  const filtered = INVOICES.filter((i) => {
    if (tab === "OPEN" && !["OPEN", "PARTIAL", "OVERDUE", "DRAFT"].includes(i.status)) return false;
    if (tab === "OVERDUE" && i.status !== "OVERDUE") return false;
    if (tab === "PAID" && i.status !== "PAID") return false;
    if (!search) return true;
    const s = search.toLowerCase();
    const c = customerById(i.customerId)?.name.toLowerCase() || "";
    return i.id.toLowerCase().includes(s) || c.includes(s) || (i.soId || "").toLowerCase().includes(s);
  });

  // Aging buckets (days past due)
  const today = new Date();
  const buckets = { current: 0, b1: 0, b2: 0, b3: 0, b4: 0 };
  INVOICES.forEach((i) => {
    if (i.status === "PAID") return;
    const balance = i.amount - i.paid;
    const overdue = Math.floor((today - new Date(i.due)) / (24 * 3600 * 1000));
    if (overdue <= 0) buckets.current += balance;
    else if (overdue <= 30) buckets.b1 += balance;
    else if (overdue <= 60) buckets.b2 += balance;
    else if (overdue <= 90) buckets.b3 += balance;
    else buckets.b4 += balance;
  });
  const totalOpen = Object.values(buckets).reduce((s, v) => s + v, 0);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><div className="card-h">AR aging</div><div className="dim" style={{ fontSize: 12, marginLeft: "auto" }}>As of {fmtDate(new Date().toISOString())}</div></div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: "Current",    val: buckets.current, color: "oklch(0.55 0.13 145)" },
            { label: "1–30 days",  val: buckets.b1,      color: "oklch(0.62 0.10 80)"  },
            { label: "31–60 days", val: buckets.b2,      color: "oklch(0.55 0.13 50)"  },
            { label: "61–90 days", val: buckets.b3,      color: "oklch(0.55 0.14 25)"  },
            { label: "90+ days",   val: buckets.b4,      color: "oklch(0.45 0.16 25)"  },
          ].map((b) => (
            <div key={b.label} style={{ borderLeft: `3px solid ${b.color}`, paddingLeft: 12 }}>
              <div className="dim" style={{ fontSize: 11.5 }}>{b.label}</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 500, marginTop: 2 }}>{PESO(b.val)}</div>
              <div className="dim" style={{ fontSize: 11, marginTop: 1 }}>{totalOpen > 0 ? Math.round(b.val / totalOpen * 100) : 0}% of open</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tabs">
        {[["OPEN", "Open", counts.OPEN], ["OVERDUE", "Overdue", counts.OVERDUE], ["PAID", "Paid", counts.PAID], ["ALL", "All", counts.ALL]].map(([k, l, n]) => (
          <button key={k} className="tab" data-active={tab === k ? "1" : "0"} onClick={() => setTab(k)}>{l} <span className="tab-count">{n}</span></button>
        ))}
      </div>

      <div className="filters">
        <div className="search" style={{ width: 320 }}>
          <Icon.Search />
          <input placeholder="Invoice, customer, or SO…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-sm" style={{ marginLeft: "auto" }}><Icon.Down /> Statements run</button>
        <button className="btn btn-primary btn-sm"><Icon.Plus /> New invoice</button>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Invoice</th><th>Customer</th><th>SO</th>
            <th>Issued</th><th>Due</th>
            <th className="num">Amount</th><th className="num">Paid</th><th className="num">Balance</th>
            <th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map((i) => {
              const c = customerById(i.customerId);
              const balance = i.amount - i.paid;
              const overdue = i.status === "OVERDUE";
              const days = Math.floor((today - new Date(i.due)) / (24 * 3600 * 1000));
              return (
                <tr key={i.id}>
                  <td className="id">{i.id}</td>
                  <td>{c?.name || "—"}</td>
                  <td className="dim mono" style={{ fontSize: 12 }}>{i.soId}</td>
                  <td>{fmtDate(i.issued)}</td>
                  <td style={overdue ? { color: "var(--st-cancel-fg)", fontWeight: 500 } : {}}>
                    {fmtDate(i.due)}{overdue && days > 0 && <span className="dim mono" style={{ fontSize: 11 }}> · {days}d late</span>}
                  </td>
                  <td className="num mono">{PESO(i.amount)}</td>
                  <td className="num mono dim">{i.paid > 0 ? PESO(i.paid) : "—"}</td>
                  <td className="num mono" style={{ fontWeight: 500, color: balance > 0 && overdue ? "var(--st-cancel-fg)" : "var(--fg)" }}>{PESO(balance)}</td>
                  <td><InvStatusPill status={i.status} /></td>
                  <td style={{ textAlign: "right", paddingRight: 10 }}>
                    {balance > 0
                      ? <button className="btn btn-sm btn-primary"><Icon.Wallet /> Record payment</button>
                      : <button className="btn-ghost btn btn-sm"><Icon.Doc /> View</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvStatusPill({ status }) {
  const map = {
    DRAFT:   { label: "Draft",    bg: "oklch(0.94 0.01 250)", fg: "oklch(0.40 0.02 250)" },
    OPEN:    { label: "Open",     bg: "oklch(0.95 0.03 240)", fg: "oklch(0.35 0.10 240)" },
    PARTIAL: { label: "Partial",  bg: "oklch(0.94 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
    OVERDUE: { label: "Overdue",  bg: "oklch(0.94 0.05 25)",  fg: "oklch(0.40 0.12 25)"  },
    PAID:    { label: "Paid",     bg: "oklch(0.94 0.04 145)", fg: "oklch(0.32 0.10 145)" },
  }[status];
  return <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 11.5, background: map.bg, color: map.fg, fontWeight: 500 }}>{map.label}</span>;
}

// ── Payables
function PayablesTab() {
  const [tab, setTab] = React.useState("OPEN");
  const today = new Date();
  const counts = {
    OPEN: BILLS.filter((b) => ["OPEN", "DUE", "OVERDUE", "PARTIAL"].includes(b.status)).length,
    OVERDUE: BILLS.filter((b) => b.status === "OVERDUE").length,
    PAID: BILLS.filter((b) => b.status === "PAID").length,
    ALL: BILLS.length,
  };
  const filtered = BILLS.filter((b) => {
    if (tab === "OPEN") return ["OPEN", "DUE", "OVERDUE", "PARTIAL"].includes(b.status);
    if (tab === "OVERDUE") return b.status === "OVERDUE";
    if (tab === "PAID") return b.status === "PAID";
    return true;
  });

  // Cash-out forecast: next 30 days
  const due7 = BILLS.filter((b) => b.status !== "PAID" && new Date(b.due) <= new Date(today.getTime() + 7*24*3600*1000)).reduce((s, b) => s + (b.amount - b.paid), 0);
  const due30 = BILLS.filter((b) => b.status !== "PAID" && new Date(b.due) <= new Date(today.getTime() + 30*24*3600*1000)).reduce((s, b) => s + (b.amount - b.paid), 0);
  const totalOpen = BILLS.filter((b) => b.status !== "PAID").reduce((s, b) => s + (b.amount - b.paid), 0);
  const overdue = BILLS.filter((b) => b.status === "OVERDUE").reduce((s, b) => s + (b.amount - b.paid), 0);

  return (
    <div>
      <div className="stat-grid">
        <Stat label="Total payable" value={SHORT_PESO(totalOpen)} trend={`${counts.OPEN} open bills`} />
        <Stat label="Due within 7 days" value={SHORT_PESO(due7)} trend="Cash-out priority" dn={due7 > 1000000} />
        <Stat label="Due within 30 days" value={SHORT_PESO(due30)} trend="Forecast outflow" />
        <Stat label="Overdue" value={SHORT_PESO(overdue)} trend={overdue > 0 ? "Late · pay now" : "All current"} dn={overdue > 0} />
      </div>

      <div className="tabs">
        {[["OPEN", "Open", counts.OPEN], ["OVERDUE", "Overdue", counts.OVERDUE], ["PAID", "Paid", counts.PAID], ["ALL", "All", counts.ALL]].map(([k, l, n]) => (
          <button key={k} className="tab" data-active={tab === k ? "1" : "0"} onClick={() => setTab(k)}>{l} <span className="tab-count">{n}</span></button>
        ))}
      </div>

      <div className="filters">
        <button className="btn btn-sm" style={{ marginLeft: "auto" }}><Icon.Down /> Export aging</button>
        <button className="btn btn-sm"><Icon.Wallet /> Pay run</button>
        <button className="btn btn-primary btn-sm"><Icon.Plus /> New bill</button>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Bill</th><th>Vendor</th><th>Reference</th>
            <th>Issued</th><th>Due</th>
            <th className="num">Amount</th><th className="num">Balance</th>
            <th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map((b) => {
              const sup = b.supplierId ? SUPPLIERS.find((s) => s.id === b.supplierId) : null;
              const balance = b.amount - b.paid;
              const days = Math.floor((today - new Date(b.due)) / (24 * 3600 * 1000));
              const isOverdue = b.status === "OVERDUE";
              return (
                <tr key={b.id}>
                  <td className="id">{b.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{sup?.name || b.vendor}</div>
                    {b.note && <div className="dim" style={{ fontSize: 11.5, marginTop: 1 }}>{b.note}</div>}
                  </td>
                  <td className="dim mono" style={{ fontSize: 12 }}>{b.ref || "—"}</td>
                  <td>{fmtDate(b.issued)}</td>
                  <td style={isOverdue ? { color: "var(--st-cancel-fg)", fontWeight: 500 } : {}}>
                    {fmtDate(b.due)}{isOverdue && days > 0 && <span className="dim mono" style={{ fontSize: 11 }}> · {days}d late</span>}
                  </td>
                  <td className="num mono">{PESO(b.amount)}</td>
                  <td className="num mono" style={{ fontWeight: 500 }}>{PESO(balance)}</td>
                  <td><BillStatusPill status={b.status} /></td>
                  <td style={{ textAlign: "right", paddingRight: 10 }}>
                    {balance > 0 && <button className="btn btn-sm btn-primary"><Icon.Wallet /> Pay</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillStatusPill({ status }) {
  const map = {
    OPEN:    { label: "Open",     bg: "oklch(0.95 0.03 240)", fg: "oklch(0.35 0.10 240)" },
    DUE:     { label: "Due soon", bg: "oklch(0.94 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
    PARTIAL: { label: "Partial",  bg: "oklch(0.94 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
    OVERDUE: { label: "Overdue",  bg: "oklch(0.94 0.05 25)",  fg: "oklch(0.40 0.12 25)"  },
    PAID:    { label: "Paid",     bg: "oklch(0.94 0.04 145)", fg: "oklch(0.32 0.10 145)" },
  }[status];
  return <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 11.5, background: map.bg, color: map.fg, fontWeight: 500 }}>{map.label}</span>;
}

// ── Trial Balance
function TrialBalanceTab() {
  const tb = trialBalance();
  let totalDr = 0, totalCr = 0;
  const rows = COA.map((a) => {
    const v = tb[a.code] || 0;
    const dr = v > 0 ? v : 0;
    const cr = v < 0 ? -v : 0;
    totalDr += dr; totalCr += cr;
    return { ...a, dr, cr, v };
  });
  const groups = {};
  rows.forEach((r) => { (groups[r.type] = groups[r.type] || []).push(r); });
  const order = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

  return (
    <div>
      <div className="filters">
        <span className="dim" style={{ fontSize: 13 }}>Trial balance · as of {fmtDate(new Date().toISOString())}</span>
        <button className="btn btn-sm" style={{ marginLeft: "auto" }}><Icon.Down /> Export to Excel</button>
        <button className="btn btn-sm"><Icon.Print /> Print</button>
      </div>

      <div className="card">
        <div className="table-wrap" style={{ margin: 0, borderRadius: 0 }}>
          <table className="tbl tb">
            <thead><tr><th style={{ width: 80 }}>Code</th><th>Account</th><th>Type</th><th className="num">Debit</th><th className="num">Credit</th></tr></thead>
            <tbody>
              {order.map((typ) => (
                <React.Fragment key={typ}>
                  <tr className="tb-group"><td colSpan="5">{typ}</td></tr>
                  {groups[typ].map((r) => (
                    <tr key={r.code}>
                      <td className="id mono">{r.code}</td>
                      <td>{r.name}</td>
                      <td className="dim" style={{ fontSize: 11.5 }}>{r.normal}</td>
                      <td className="num mono" style={{ color: r.dr ? "var(--fg)" : "var(--ink-4)" }}>{r.dr ? PESO(r.dr) : "—"}</td>
                      <td className="num mono" style={{ color: r.cr ? "var(--fg)" : "var(--ink-4)" }}>{r.cr ? PESO(r.cr) : "—"}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr style={{ borderTop: "2px solid var(--ink)" }}>
                <td colSpan="3" style={{ fontWeight: 600, paddingTop: 10 }}>TOTALS</td>
                <td className="num mono" style={{ fontWeight: 600, paddingTop: 10 }}>{PESO(totalDr)}</td>
                <td className="num mono" style={{ fontWeight: 600, paddingTop: 10 }}>{PESO(totalCr)}</td>
              </tr>
              <tr>
                <td colSpan="3" className="dim" style={{ fontSize: 12 }}>Difference</td>
                <td colSpan="2" className="num mono" style={{ color: Math.abs(totalDr - totalCr) < 1 ? "oklch(0.45 0.12 145)" : "var(--st-cancel-fg)", fontWeight: 500 }}>
                  {Math.abs(totalDr - totalCr) < 1 ? "✓ In balance" : PESO(totalDr - totalCr)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Statements (P&L + Balance Sheet)
function StatementsTab() {
  const [report, setReport] = React.useState("PL");
  const tb = trialBalance();
  return (
    <div>
      <div className="filters">
        <button className="chip" data-on={report === "PL" ? "1" : "0"} onClick={() => setReport("PL")}>Income statement</button>
        <button className="chip" data-on={report === "BS" ? "1" : "0"} onClick={() => setReport("BS")}>Balance sheet</button>
        <button className="chip" data-on={report === "CF" ? "1" : "0"} onClick={() => setReport("CF")}>Cash flow</button>
        <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>YTD 2026 · accrual basis</span>
        <button className="btn btn-sm"><Icon.Down /> PDF</button>
      </div>

      {report === "PL" && <IncomeStatement tb={tb} />}
      {report === "BS" && <BalanceSheet tb={tb} />}
      {report === "CF" && <CashFlow />}
    </div>
  );
}

function IncomeStatement({ tb }) {
  const v = (c) => Math.abs(tb[c] || 0);
  const sales = v("4000"), lease = v("4100"), service = v("4200"), returns = v("4900");
  const revenue = sales + lease + service - returns;
  const cogs = v("5000");
  const gm = revenue - cogs;
  const opex = v("5100") + v("5200") + v("5300") + v("5400") + v("5500") + v("5600") + v("5700");
  const ni = gm - opex;
  return (
    <div className="card statement">
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", textAlign: "center" }}>
        <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>ChartCare Healthcare Distribution Inc.</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>Statement of Comprehensive Income</div>
        <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>For the period ended {fmtDate(new Date().toISOString())}</div>
      </div>
      <div className="card-body" style={{ paddingLeft: 32, paddingRight: 32 }}>
        <StmtRow label="Sales revenue" value={sales} />
        <StmtRow label="Lease revenue" value={lease} />
        <StmtRow label="Service revenue (PMS)" value={service} />
        <StmtRow label="Less: returns and allowances" value={-returns} indent />
        <StmtRow label="Net revenue" value={revenue} subtotal />
        <StmtRow label="Cost of goods sold" value={-cogs} indent />
        <StmtRow label="Gross profit" value={gm} subtotal />
        <div className="dim" style={{ fontSize: 11, marginTop: 14, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Operating expenses</div>
        <StmtRow label="Salaries and wages" value={-v("5100")} indent />
        <StmtRow label="Rent" value={-v("5200")} indent />
        <StmtRow label="Utilities" value={-v("5300")} indent />
        <StmtRow label="Freight and logistics" value={-v("5400")} indent />
        <StmtRow label="Depreciation" value={-v("5500")} indent />
        <StmtRow label="Bad debt" value={-v("5600")} indent />
        <StmtRow label="Bank charges" value={-v("5700")} indent />
        <StmtRow label="Total operating expenses" value={-opex} subtotal />
        <StmtRow label="Net income before tax" value={ni} total />
      </div>
    </div>
  );
}

function BalanceSheet({ tb }) {
  const v = (c) => tb[c] || 0;
  const cash = v("1000") + v("1010") + v("1020");
  const ar = v("1100") + v("1110");
  const cwt = v("1150");
  const inv = v("1200") + v("1210") + v("1220");
  const prepaid = v("1300");
  const ppe = v("1500") + v("1510");
  const totalAssets = cash + ar + cwt + inv + prepaid + ppe;
  const ap = -v("2000");
  const vatPay = -(v("2100") + v("2110"));
  const wtPay = -(v("2150") + v("2160"));
  const ssPay = -(v("2200") + v("2210") + v("2220"));
  const dep = -v("2300");
  const totalLiab = ap + vatPay + wtPay + ssPay + dep;
  const cap = -v("3000");
  const re = -v("3100");
  // Net income to retained earnings
  const ni = -((v("4000") + v("4100") + v("4200")) - v("4900")) - (v("5000") + v("5100") + v("5200") + v("5300") + v("5400") + v("5500") + v("5600") + v("5700"));
  const totalEq = cap + re + (-ni);
  return (
    <div className="card statement">
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", textAlign: "center" }}>
        <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>ChartCare Healthcare Distribution Inc.</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>Statement of Financial Position</div>
        <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>As of {fmtDate(new Date().toISOString())}</div>
      </div>
      <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, paddingLeft: 32, paddingRight: 32 }}>
        <div>
          <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Assets</div>
          <StmtRow label="Cash and cash equivalents" value={cash} />
          <StmtRow label="Accounts receivable, net" value={ar} />
          <StmtRow label="CWT receivable" value={cwt} />
          <StmtRow label="Inventory" value={inv} />
          <StmtRow label="Prepaid expenses" value={prepaid} />
          <StmtRow label="PP&E, net of depreciation" value={ppe} />
          <StmtRow label="Total assets" value={totalAssets} total />
        </div>
        <div>
          <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Liabilities & Equity</div>
          <StmtRow label="Accounts payable" value={ap} />
          <StmtRow label="VAT payable, net" value={vatPay} />
          <StmtRow label="Withholding tax payable" value={wtPay} />
          <StmtRow label="Statutory contributions" value={ssPay} />
          <StmtRow label="Customer deposits" value={dep} />
          <StmtRow label="Total liabilities" value={totalLiab} subtotal />
          <StmtRow label="Owner's capital" value={cap} />
          <StmtRow label="Retained earnings" value={re} />
          <StmtRow label="Net income (period)" value={-ni} />
          <StmtRow label="Total equity" value={totalEq} subtotal />
          <StmtRow label="Total liabilities & equity" value={totalLiab + totalEq} total />
        </div>
      </div>
    </div>
  );
}

function CashFlow() {
  // Synthetic-ish summary
  const opIn = 18420000, opOut = 14600000;
  const investOut = 1850000;
  const finOut = 320000;
  const net = (opIn - opOut) - investOut - finOut;
  return (
    <div className="card statement">
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", textAlign: "center" }}>
        <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>ChartCare Healthcare Distribution Inc.</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>Statement of Cash Flows</div>
        <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>YTD 2026 · indirect method</div>
      </div>
      <div className="card-body" style={{ paddingLeft: 32, paddingRight: 32 }}>
        <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Operating activities</div>
        <StmtRow label="Cash collected from customers" value={opIn} indent />
        <StmtRow label="Cash paid to suppliers and employees" value={-opOut} indent />
        <StmtRow label="Net cash from operations" value={opIn - opOut} subtotal />
        <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 14, marginBottom: 4 }}>Investing activities</div>
        <StmtRow label="Equipment purchases (PPE)" value={-investOut} indent />
        <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 14, marginBottom: 4 }}>Financing activities</div>
        <StmtRow label="Loan principal repayments" value={-finOut} indent />
        <StmtRow label="Net change in cash" value={net} total />
        <StmtRow label="Cash, beginning" value={9560000} indent />
        <StmtRow label="Cash, ending" value={9560000 + net} subtotal />
      </div>
    </div>
  );
}

function StmtRow({ label, value, indent, subtotal, total }) {
  return (
    <div style={{
      display: "flex", padding: "5px 0",
      paddingLeft: indent ? 22 : 0,
      borderTop: subtotal || total ? "1px solid var(--line)" : "none",
      marginTop: subtotal ? 4 : total ? 8 : 0,
      paddingTop: subtotal || total ? 8 : 5,
      borderBottom: total ? "2px double var(--ink)" : "none",
      paddingBottom: total ? 10 : 5,
    }}>
      <span style={{ fontSize: 13, fontWeight: total || subtotal ? 600 : 400 }}>{label}</span>
      <span className="mono" style={{ marginLeft: "auto", fontSize: 13, fontWeight: total || subtotal ? 600 : 400 }}>
        {value < 0 ? `(${PESO(-value)})` : PESO(value)}
      </span>
    </div>
  );
}

// ── BIR filings
function BirTab() {
  return (
    <div>
      <div className="callout" style={{ marginBottom: 16 }}>
        <Icon.Doc />
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{BIR_FILINGS.filter((f) => f.status === "DUE").length} BIR filings need attention this period</div>
          <div className="dim" style={{ fontSize: 12 }}>Returns are auto-prepared from posted entries — review and e-file directly to BIR through eFPS.</div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }}><Icon.ExternalLink /> Open eFPS</button>
      </div>

      <div className="stat-grid">
        <Stat label="Output VAT (period)" value={SHORT_PESO(540000 + 33480 + 19800 + 9900 + 29321)} trend="From posted invoices" />
        <Stat label="Input VAT (period)" value={SHORT_PESO(320000 + 90000 + 22500 + 4608 + 20571)} trend="Creditable" />
        <Stat label="EWT withheld (Apr)" value={SHORT_PESO(56000)} trend="To remit via 0619-E" />
        <Stat label="WTC withheld (Apr)" value={SHORT_PESO(196000)} trend="To remit via 1601-C" />
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Form</th><th>Filing ID</th><th>Period</th><th>Description</th>
            <th>Due date</th><th className="num">Tax due</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {BIR_FILINGS.map((f) => {
              const overdue = f.status === "DUE" && new Date(f.due) < new Date();
              return (
                <tr key={f.id}>
                  <td><span className="bir-form">{f.form}</span></td>
                  <td className="id">{f.id}</td>
                  <td>{f.period}</td>
                  <td>{f.desc}</td>
                  <td style={overdue ? { color: "var(--st-cancel-fg)", fontWeight: 500 } : {}}>{fmtDate(f.due)}</td>
                  <td className="num mono">{f.amount > 0 ? PESO(f.amount) : "—"}</td>
                  <td><BirStatusPill status={f.status} /></td>
                  <td style={{ textAlign: "right", paddingRight: 10 }}>
                    {f.status === "DUE" && <button className="btn btn-sm btn-primary"><Icon.Doc /> Prepare</button>}
                    {f.status === "FILED" && <button className="btn-ghost btn btn-sm"><Icon.Down /> Confirmation</button>}
                    {f.status === "PENDING" && <button className="btn btn-sm">Draft</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BirStatusPill({ status }) {
  const map = {
    DUE:     { label: "Due",     bg: "oklch(0.94 0.05 25)",  fg: "oklch(0.40 0.12 25)"  },
    PENDING: { label: "Pending", bg: "oklch(0.94 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
    FILED:   { label: "Filed",   bg: "oklch(0.94 0.04 145)", fg: "oklch(0.32 0.10 145)" },
  }[status];
  return <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 11.5, background: map.bg, color: map.fg, fontWeight: 500 }}>{map.label}</span>;
}

Object.assign(window, { AccountingView });
