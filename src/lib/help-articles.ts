export type HelpRole = "ADMIN" | "AGENT" | "FINANCE" | "WAREHOUSE" | "TECHNICIAN" | "DRIVER" | "CUSTOMER";

export interface HelpStep {
  title: string;
  description: string;
  tip?: string;
  warning?: string;
  note?: string;
}

export interface HelpWorkflow {
  title: string;
  description?: string;
  roles?: HelpRole[];
  steps: HelpStep[];
}

export interface HelpArticle {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  roles: HelpRole[];
  overview: string;
  concepts?: { term: string; definition: string }[];
  workflows: HelpWorkflow[];
  faqs?: { q: string; a: string }[];
}

export const HELP_ARTICLES: HelpArticle[] = [

  // ─── 1. Getting Started ──────────────────────────────────────────────────────
  {
    slug: "getting-started",
    title: "Getting Started",
    subtitle: "Login, navigation, and your first steps in the system",
    icon: "🚀",
    roles: ["ADMIN", "AGENT", "FINANCE", "WAREHOUSE", "TECHNICIAN", "DRIVER", "CUSTOMER"],
    overview:
      "This guide walks you through logging in, understanding your role, and finding your way around the system. Every user has a role that controls which pages they can see and what actions they can take. This is by design — a warehouse staff member doesn't need access to accounting, and a customer only sees their own orders.",
    concepts: [
      { term: "Role", definition: "Your job function in the system. Set by an Administrator. Determines which pages and actions are available to you." },
      { term: "Dashboard", definition: "Your home screen after login. Shows a summary of activity relevant to your role." },
      { term: "Sidebar", definition: "The navigation menu on the left side of every page. Only shows sections your role can access." },
      { term: "Session", definition: "Your login session. The system will ask you to log in again after a period of inactivity." },
    ],
    workflows: [
      {
        title: "Logging in for the first time",
        steps: [
          { title: "Open the application", description: "Navigate to the app URL provided by your administrator. The login screen will appear automatically if you are not already logged in." },
          { title: "Enter your credentials", description: "Type in your email address and password exactly as provided by your Administrator. Passwords are case-sensitive.", tip: "If you were given a temporary password, you can ask your Administrator to update it in Settings → Users." },
          { title: "Click Sign In", description: "After successful login you will land on the Dashboard. The sidebar on the left shows the sections available to your role." },
          { title: "Familiarise yourself with the layout", description: "The sidebar is your main navigation. The top bar shows your name and role. Click your name in the sidebar footer to see your account details. Click Sign Out when done." },
        ],
      },
      {
        title: "Understanding your role's access",
        steps: [
          { title: "Agent", description: "Can create and view sales orders, create quotations, and manage customers. Cannot approve orders or access accounting.", note: "Agents see all orders across all customers unless restricted." },
          { title: "Finance", description: "Can approve orders, create and manage invoices, record payments, manage bills, handle BIR filings, and run reports. Cannot physically handle stock." },
          { title: "Warehouse", description: "Can advance orders from Approved → Preparing → Shipped, receive inbound purchase orders, manage stock levels, and handle returns and transfers." },
          { title: "Technician", description: "Can view and update work orders assigned to them. Writes notes on maintenance progress." },
          { title: "Driver", description: "Can view assigned shipments. Marks deliveries as completed." },
          { title: "Admin", description: "Full access to all modules including user management and system settings.", warning: "Admin accounts should be kept to a minimum. Use role-specific accounts for daily operations." },
          { title: "Customer", description: "Accesses the Customer Portal only. Can view their own orders, invoices, and quotations. Cannot see any other customer's data." },
        ],
      },
      {
        title: "Navigating the application",
        steps: [
          { title: "Use the sidebar to move between modules", description: "Click any item in the left sidebar to navigate. The current page is highlighted. On mobile, tap the hamburger icon to open the sidebar." },
          { title: "Use breadcrumbs and back buttons", description: "Detail pages (like an individual order) have a ← back button at the top left. Use this rather than the browser back button for the best experience." },
          { title: "Look for action buttons in the top-right of cards", description: "Most list pages have action buttons like '+ New Order' or 'Export CSV' in the top right area of the page or card header." },
          { title: "Use the Help button on each page", description: "Every major page has a ? Help button in the top-right area. Clicking it opens the relevant training article for that module.", tip: "Press ? on any page to jump directly to this help system." },
        ],
      },
    ],
    faqs: [
      { q: "I forgot my password — what do I do?", a: "Contact your Administrator. They can reset your password from Settings → Users → Edit User." },
      { q: "Why can't I see a certain menu item?", a: "Menu items are controlled by your role. If you need access to a section, ask your Administrator to update your role or create a more appropriate account." },
      { q: "Can I be logged in on multiple devices at the same time?", a: "Yes. Sessions are independent per device and browser." },
      { q: "Is my data saved automatically?", a: "Yes — all actions (creating orders, recording payments, etc.) are saved immediately when you click the confirm or submit button. There is no manual save step." },
    ],
  },

  // ─── 2. Dashboard ────────────────────────────────────────────────────────────
  {
    slug: "dashboard",
    title: "Dashboard",
    subtitle: "Your command centre — key metrics at a glance",
    icon: "📊",
    roles: ["ADMIN", "AGENT", "FINANCE", "WAREHOUSE", "TECHNICIAN"],
    overview:
      "The Dashboard is the first page you see after logging in. It gives you a real-time snapshot of the business: pending orders, stock alerts, overdue invoices, and upcoming maintenance. The exact widgets you see depend on your role — a Warehouse user sees stock and shipment data, while Finance sees AR and billing summaries.",
    concepts: [
      { term: "KPI Card", definition: "A summary number shown in a coloured box — e.g. 'Pending Orders: 12'. Click most KPI cards to navigate to the related list." },
      { term: "Revenue Chart", definition: "A bar chart showing monthly revenue for the current year. Based on delivered orders." },
      { term: "Pending Approvals", definition: "Orders in PENDING state waiting for a Finance or Admin user to approve them." },
    ],
    workflows: [
      {
        title: "Reading the dashboard",
        steps: [
          { title: "Check pending approvals (Finance/Admin)", description: "The 'Pending Approvals' card shows how many orders are waiting. Click it to go straight to the Approvals page.", tip: "Aim to process approvals within one business day to keep the order pipeline moving." },
          { title: "Check low stock alerts (Warehouse)", description: "The inventory widget highlights items where on-hand quantity is at or below the reorder point. Click to go to Inventory and investigate.", warning: "Items showing 0 available (onHand minus reserved = 0) cannot be picked for new orders." },
          { title: "Check overdue invoices (Finance)", description: "The AR summary shows invoices past their due date. These represent cash that should already have been collected." },
          { title: "Review the revenue chart", description: "The bar chart shows month-over-month revenue from delivered orders. Hover over a bar to see the exact amount." },
          { title: "Review recent orders", description: "The recent orders table at the bottom shows the last 10 orders across all customers. Click any row to open the order detail." },
        ],
      },
    ],
    faqs: [
      { q: "The dashboard numbers don't match what I see on the orders page. Why?", a: "The dashboard may be cached for a few seconds. Refresh the page to get the latest figures." },
      { q: "Can I customise the dashboard?", a: "Not yet. The widgets shown are determined by your role and cannot be rearranged." },
    ],
  },

  // ─── 3. Sales Orders ─────────────────────────────────────────────────────────
  {
    slug: "sales-orders",
    title: "Sales Orders",
    subtitle: "Creating, tracking, and fulfilling customer orders end-to-end",
    icon: "🛒",
    roles: ["AGENT", "FINANCE", "WAREHOUSE", "ADMIN", "CUSTOMER"],
    overview:
      "A Sales Order records a customer's request to purchase products. It follows a strict lifecycle: PENDING → APPROVED → PREPARING → SHIPPED → DELIVERED. Each stage requires a specific role to advance it, creating a clear chain of responsibility from the sales agent who created the order all the way to the warehouse staff who ships it. The order cannot skip stages — this is intentional.",
    concepts: [
      { term: "Order State", definition: "Where the order is in its lifecycle. States move forward only (except cancellation). See the workflow diagram below." },
      { term: "Order Lines", definition: "Each product in the order, with quantity and unit price. An order must have at least one line." },
      { term: "Subtotal", definition: "The sum of all line totals before tax." },
      { term: "VAT", definition: "Value Added Tax at 12%, calculated on the subtotal. Automatically computed." },
      { term: "CWT 2307", definition: "Creditable Withholding Tax at 2%, deducted from the total. Optional — tick the checkbox if the customer is a withholding agent." },
      { term: "Stock Reservation", definition: "When an order is APPROVED, the required stock is reserved in the warehouse. Reserved stock cannot be promised to another order." },
      { term: "PO Reference", definition: "The customer's internal purchase order number. Optional, but important for hospitals that require PO-matching on invoices." },
    ],
    workflows: [
      {
        title: "Creating a new sales order",
        roles: ["AGENT", "FINANCE", "ADMIN"],
        steps: [
          { title: "Go to Sales Orders → + New Order", description: "Click 'Sales Orders' in the sidebar, then click the '+ New Order' button in the top-right." },
          { title: "Select the customer", description: "Choose the customer from the dropdown. If the customer has a credit limit configured, a credit utilisation bar will appear showing how much of their limit is already used by open invoices.", tip: "Can't find the customer? Go to Customers and create them first." },
          { title: "Select the warehouse", description: "Choose which warehouse will fulfil this order. Stock availability is checked per warehouse." },
          { title: "Add line items", description: "Click '+ Add line', select a product from the catalogue, set the quantity, and confirm the unit price (auto-filled from the catalogue but can be overridden).", warning: "You cannot save an order with a zero unit price. If a product is being given free-of-charge, this must be handled through a credit memo after invoicing." },
          { title: "Apply BIR Form 2307 if needed", description: "If the customer is a government entity or withholding agent, tick the 'Apply BIR Form 2307' checkbox. This deducts 2% CWT from the order total." },
          { title: "Add notes (optional)", description: "The Notes field is for delivery instructions, special handling requirements, or any message you want the warehouse to see." },
          { title: "Click Create Order", description: "The order is saved with state PENDING and an order number is assigned (e.g. SO-2026-0001). You are taken to the order detail page.", note: "If the customer is over their credit limit, you will see a warning. Finance and Admin users can tick 'Override credit limit' to proceed. Agents cannot override." },
        ],
      },
      {
        title: "Approving an order (PENDING → APPROVED)",
        roles: ["FINANCE", "ADMIN"],
        steps: [
          { title: "Go to Approvals or open the order", description: "The Approvals page shows all PENDING orders in one place. Alternatively, find the order in Sales Orders and open it." },
          { title: "Review the order details", description: "Check the customer, line items, quantities, and totals. Verify the credit limit status shown on the Approvals page." },
          { title: "Click Approve Order", description: "The green Approve button is in the top-right area of the order detail sidebar. After clicking, the system checks that sufficient stock exists in the warehouse.", warning: "If stock is insufficient for any line item, the approval will be blocked. The error message tells you exactly which product is short. Coordinate with Warehouse to adjust stock first." },
          { title: "Stock is automatically reserved", description: "Once approved, the exact quantities are reserved in the warehouse. The inventory 'Reserved' column will increase. Reserved stock cannot be allocated to other orders." },
        ],
      },
      {
        title: "Preparing and shipping an order (APPROVED → PREPARING → SHIPPED)",
        roles: ["WAREHOUSE", "ADMIN"],
        steps: [
          { title: "Open the approved order", description: "Go to Sales Orders and filter by status APPROVED, or check your dashboard for approved orders ready to pick." },
          { title: "Click Start Preparing", description: "This moves the order to PREPARING, signalling the team to begin picking and packing." },
          { title: "Pick and pack the items", description: "Using the order detail page as your pick list, gather all items from the warehouse locations." },
          { title: "Create a shipment record (optional but recommended)", description: "If using a courier, open the Shipments page and add the tracking number, courier name, and estimated arrival date to the linked shipment record." },
          { title: "Click Mark Shipped", description: "Once the goods have left the warehouse, click Mark Shipped. This moves the order to SHIPPED and triggers an email notification to the customer." },
        ],
      },
      {
        title: "Confirming delivery (SHIPPED → DELIVERED)",
        roles: ["WAREHOUSE", "FINANCE", "ADMIN"],
        steps: [
          { title: "Confirm receipt of delivery", description: "Once the customer has received the goods (confirmed via POD, email, or phone), open the order and click Confirm Delivery." },
          { title: "Stock is automatically consumed", description: "On delivery, the system decrements the warehouse's on-hand quantity for each line item and releases the reservation. A PICK stock movement is recorded." },
          { title: "Generate an invoice (Finance)", description: "After delivery, go to Accounting → AR tab, find the order, and click Generate Invoice. This creates an invoice with the correct VAT split and posts the journal entry.", tip: "You can also generate the invoice from the order detail sidebar." },
        ],
      },
      {
        title: "Cancelling an order",
        roles: ["FINANCE", "ADMIN"],
        steps: [
          { title: "Open the order", description: "Find and open the order you need to cancel. Orders in DELIVERED or CANCELLED state cannot be cancelled again." },
          { title: "Click Cancel Order", description: "A confirmation dialog asks for a cancellation reason. Enter a brief explanation — this is recorded in the order history." },
          { title: "Stock reservation is released", description: "If the order was APPROVED or beyond, reserved stock is automatically released back to available inventory.", warning: "Cancellation is permanent. If the customer wants to re-order, a new Sales Order must be created." },
        ],
      },
      {
        title: "Printing an order",
        steps: [
          { title: "Open the order detail page", description: "Navigate to the specific order." },
          { title: "Click the Print button", description: "The print icon button in the top-right opens a print-ready version of the order in a new tab." },
          { title: "Use browser print or Save as PDF", description: "In the print view, click Print / Save PDF. Use your browser's PDF option to save a copy.", tip: "For formal invoices, use the Invoice PDF from Accounting → AR, not the order print. The invoice includes the correct VAT breakdown." },
        ],
      },
    ],
    faqs: [
      { q: "Can I edit an order after it's been created?", a: "No. Once an order is submitted it cannot be edited. If there is a mistake, cancel the order and create a new one. This audit trail is intentional." },
      { q: "Why is the Approve button not visible?", a: "Only Finance and Admin roles can approve orders. If you are an Agent, you cannot see this button." },
      { q: "The approval failed because of insufficient stock. What do I do?", a: "Coordinate with the Warehouse team to either receive new stock (via an Inbound PO) or do a stock adjustment. Once stock levels are corrected, try approving again." },
      { q: "Can a customer order be placed directly by the customer?", a: "Yes — customers with portal access (CUSTOMER role) can create orders from the Customer Portal. These appear in the Sales Orders list as PENDING and require the same approval process." },
      { q: "What does 'Reserved' mean on the inventory page?", a: "Reserved is the quantity committed to approved-but-not-yet-delivered orders. Available stock = On Hand minus Reserved." },
    ],
  },

  // ─── 4. Quotations ───────────────────────────────────────────────────────────
  {
    slug: "quotations",
    title: "Quotations & Proforma Invoices",
    subtitle: "Send price proposals and convert accepted quotes to orders",
    icon: "📋",
    roles: ["AGENT", "FINANCE", "ADMIN"],
    overview:
      "A Quotation (also called a Proforma Invoice) is a formal price proposal sent to a customer before an order is placed. It lists products, quantities, and prices, and has a validity period. When the customer accepts, you can convert it into a Sales Order with one click — all the lines are carried over automatically.",
    concepts: [
      { term: "Quote Status", definition: "DRAFT → SENT → ACCEPTED/REJECTED → CONVERTED or EXPIRED." },
      { term: "Valid Until", definition: "The date after which prices are no longer guaranteed. After this date, a SENT quote is treated as Expired." },
      { term: "Convert to Order", definition: "The action that creates a Sales Order from an accepted quotation. The quotation status becomes CONVERTED and is linked to the new order." },
      { term: "Proforma Invoice", definition: "Another name for a quotation. Some hospitals and government agencies require a Proforma before they can raise an internal purchase order." },
    ],
    workflows: [
      {
        title: "Creating a quotation",
        steps: [
          { title: "Go to Quotations → + New Quotation", description: "Click Quotations in the sidebar. Click '+ New Quotation'." },
          { title: "Select customer, warehouse, and valid-until date", description: "Choose the customer this quote is for, the warehouse that would fulfil it, and set an expiry date (default is 30 days from today)." },
          { title: "Add line items", description: "Click '+ Add line', pick the product, set quantity and price. Repeat for each item." },
          { title: "Apply CWT 2307 if applicable", description: "Tick the CWT checkbox for withholding-agent customers." },
          { title: "Add notes", description: "Use the Notes field for payment terms, delivery conditions, or any special terms you want on the proforma document.", tip: "Standard notes: 'Prices valid for 30 days. Delivery within 3–5 business days from order confirmation.'" },
          { title: "Click Create Quotation", description: "The quote is saved as DRAFT. You can still edit it before sending." },
        ],
      },
      {
        title: "Sending a quotation to the customer",
        steps: [
          { title: "Find the DRAFT quote in the list", description: "Quotations list shows all quotes. Filter by DRAFT status if the list is long." },
          { title: "Click Send", description: "The Send button changes the status to SENT and sends an email notification to the customer's email addresses (contact email + portal user emails).", note: "Email sending requires RESEND_API_KEY to be configured by the Administrator. If email is not configured, status still changes to SENT but no email is sent." },
          { title: "Share the PDF link", description: "Once sent, the quote has a printable proforma invoice. Click the quote ID or Print button to open it, then share the PDF with the customer.", tip: "Many customers prefer to receive the PDF by email as an attachment. Use Print → Save as PDF from the print view." },
        ],
      },
      {
        title: "Converting an accepted quote to a Sales Order",
        steps: [
          { title: "Confirm the customer has accepted", description: "Once the customer verbally or in writing confirms they want to proceed, find the SENT or ACCEPTED quote." },
          { title: "Click → Order", description: "The '→ Order' button appears on SENT and ACCEPTED quotes. Clicking it creates a new Sales Order with all the same line items, customer, and warehouse." },
          { title: "The Sales Order is created in PENDING state", description: "You are redirected to the new order. It follows the standard order lifecycle from here — it needs Finance approval before stock is reserved.", note: "The quotation status becomes CONVERTED and shows the linked order number." },
        ],
      },
      {
        title: "Editing a draft quote",
        steps: [
          { title: "Click Edit on a DRAFT quote", description: "Only DRAFT quotes can be edited. Once sent, you must create a new quotation if the customer requests changes." },
          { title: "Update lines, prices, or validity", description: "Make any needed changes in the edit modal." },
          { title: "Click Update Quotation", description: "Changes are saved immediately." },
        ],
      },
    ],
    faqs: [
      { q: "The customer wants to change quantities after I sent the quote. What do I do?", a: "You cannot edit a SENT quote. Create a new quotation with the updated quantities and send that one. Communicate to the customer that the new quote supersedes the old one." },
      { q: "Can a customer view their quotation in the portal?", a: "Yes. Customers with portal access can see SENT, ACCEPTED, and CONVERTED quotations in the Quotations tab of the Customer Portal, and download the PDF." },
      { q: "What happens when a quote expires?", a: "The system shows SENT quotes with a past valid-until date as 'Expired' in the portal. The status does not change automatically in the backend — you would need to create a new quote if the customer still wants to proceed." },
    ],
  },

  // ─── 5. Approvals ────────────────────────────────────────────────────────────
  {
    slug: "approvals",
    title: "Order Approvals",
    subtitle: "Review and approve pending orders before fulfilment begins",
    icon: "✅",
    roles: ["FINANCE", "ADMIN"],
    overview:
      "The Approvals page is a dedicated queue for Finance and Admin users to review and approve Sales Orders. It shows all PENDING orders with key information — customer, total, credit utilisation — so you can make informed decisions quickly without opening each order individually.",
    concepts: [
      { term: "Approval Queue", definition: "The list of all PENDING orders waiting for sign-off. Orders appear here as soon as an Agent submits them." },
      { term: "Credit Utilisation", definition: "Shown as a coloured progress bar per customer. Red means the new order would push them over their credit limit." },
    ],
    workflows: [
      {
        title: "Processing the approvals queue",
        steps: [
          { title: "Go to Approvals in the sidebar", description: "The Approvals page shows all PENDING orders sorted by date (oldest first — longest-waiting orders are at the top)." },
          { title: "Review each order", description: "For each pending order, check: customer name, order total, credit bar status, and any notes from the agent." },
          { title: "Open the order for full details", description: "Click the order ID to open the full order detail page. Review individual line items and check if prices are correct." },
          { title: "Approve the order", description: "Click the green 'Approve Order' button in the order detail sidebar. The system immediately checks stock availability.", warning: "If the customer is over their credit limit and the Agent did not request an override, the system will block the approval. You can override this as a Finance or Admin user by approving from the order detail page and ticking the override checkbox." },
          { title: "Handle stock-blocked approvals", description: "If approval fails due to insufficient stock, note which product is short and coordinate with the Warehouse team to resolve before retrying.", tip: "You can add a note to the order event log by cancelling and recreating, or message the Warehouse team directly." },
        ],
      },
    ],
    faqs: [
      { q: "An agent is asking me to approve an order urgently. How do I find it quickly?", a: "Go to Approvals and search by the customer name or order ID. The list is sorted oldest-first by default." },
      { q: "Should I approve orders even if the customer is slightly over their credit limit?", a: "This is a business decision. The system will warn you but will not block Finance/Admin from approving. Consider the customer's payment history and relationship before deciding." },
    ],
  },

  // ─── 6. Credit Limits ────────────────────────────────────────────────────────
  {
    slug: "credit-limits",
    title: "Credit Limits & Overrides",
    subtitle: "Controlling customer credit exposure and handling exceptions",
    icon: "💳",
    roles: ["FINANCE", "ADMIN", "AGENT"],
    overview:
      "Credit limits control how much outstanding (unpaid) debt a customer can accumulate before new orders are blocked. The system computes a customer's outstanding balance as the sum of all unpaid invoice balances, then adds the new order total to project the post-order exposure. If this exceeds the credit limit, the system reacts differently depending on your role.",
    concepts: [
      { term: "Credit Limit", definition: "The maximum outstanding AR balance allowed for a customer. Set in pesos on the Customer record. Zero means no limit is enforced." },
      { term: "Outstanding AR", definition: "The total of unpaid invoice balances for the customer (invoice amount minus payments already received)." },
      { term: "Available Credit", definition: "Credit Limit minus Outstanding AR. This is how much room the customer still has." },
      { term: "Credit Override", definition: "Approving an order that would exceed the credit limit. Only Finance and Admin can do this." },
    ],
    workflows: [
      {
        title: "Setting a customer's credit limit",
        roles: ["FINANCE", "ADMIN"],
        steps: [
          { title: "Go to Customers and open the customer record", description: "Find the customer in the Customers list and click their name to open the detail view." },
          { title: "Edit the credit limit field", description: "Click Edit and find the Credit Limit field. Enter the limit in pesos (e.g. 500000 for ₱500,000.00).", tip: "Set to 0 to disable credit limit enforcement for this customer entirely." },
          { title: "Save the change", description: "The new limit takes effect immediately on the next order for that customer." },
        ],
      },
      {
        title: "What happens when a customer is near their limit",
        steps: [
          { title: "The credit bar appears when creating an order", description: "When an Agent selects a customer with a credit limit, a credit utilisation bar appears in the new order form. It shows current outstanding, projected outstanding (including this order), and available credit." },
          { title: "Green bar (under 75%)", description: "No action required. Order can be submitted normally." },
          { title: "Amber bar (75–100%)", description: "A warning is shown but the Agent can still submit. Finance should be aware when reviewing the approval." },
          { title: "Red bar (over 100%)", description: "The customer is over their limit. The Agent sees the warning but cannot override it — they can still submit the order but it will be flagged. Finance or Admin must explicitly tick 'Override credit limit' to approve it." },
        ],
      },
      {
        title: "Overriding a credit limit as Finance or Admin",
        roles: ["FINANCE", "ADMIN"],
        steps: [
          { title: "Open the pending order", description: "Go to the order submitted by the Agent. The credit status is shown in the order detail." },
          { title: "Review the credit position", description: "Confirm the customer's outstanding balance and whether the exception is justified." },
          { title: "Tick Override credit limit and approve", description: "On the order detail page, tick the override checkbox and click Approve. The override is recorded in the order event log.", warning: "Overrides are tracked. Run the AR Aging report regularly to monitor customers who are frequently over limit." },
        ],
      },
    ],
    faqs: [
      { q: "Outstanding AR is wrong — a customer shows a balance but they've already paid.", a: "The payment may not have been recorded. Go to Accounting → AR tab, find the invoice, and record the payment. The credit limit check uses invoice balances, not bank records." },
      { q: "We want to give a new customer a trial period with no credit limit. How?", a: "Set their credit limit to 0 (zero). This disables enforcement entirely. When you're ready to enforce a limit, update it to the appropriate amount." },
    ],
  },

  // ─── 7. Inventory ────────────────────────────────────────────────────────────
  {
    slug: "inventory",
    title: "Inventory & Stock Management",
    subtitle: "Track on-hand quantities, adjustments, and stock movements",
    icon: "📦",
    roles: ["WAREHOUSE", "ADMIN"],
    overview:
      "The Inventory module shows current stock levels for every product across all warehouses. It tracks On Hand (physical units in the warehouse), Reserved (committed to approved orders), and Available (On Hand minus Reserved). Every change to stock — receiving, picking, adjustments, returns — is recorded as a Stock Movement for full traceability.",
    concepts: [
      { term: "On Hand", definition: "The number of units physically present in the warehouse right now." },
      { term: "Reserved", definition: "Units committed to orders that have been approved but not yet delivered. You cannot pick reserved stock for a different order." },
      { term: "Available", definition: "On Hand minus Reserved. This is the number of units you can actually promise to a new order." },
      { term: "Reorder Point", definition: "The minimum stock level before a reorder should be triggered. When available drops to or below this number, the item appears as low-stock." },
      { term: "Stock Move", definition: "A record of any change to stock: RECEIPT (goods in), PICK (goods out for order), RETURN (goods back in), TRANSFER (moved between warehouses), ADJUSTMENT (manual correction)." },
    ],
    workflows: [
      {
        title: "Checking current stock levels",
        steps: [
          { title: "Go to Inventory in the sidebar", description: "The main inventory page shows all products with their current on-hand, reserved, and available quantities per warehouse." },
          { title: "Filter by warehouse", description: "Use the warehouse filter dropdown to focus on a specific location." },
          { title: "Identify low-stock items", description: "Items where available quantity is at or below the reorder point are highlighted. These need attention.", tip: "Set reorder points on each product to make the low-stock alert meaningful. A reorder point of 0 means you'll only notice when you run out." },
          { title: "View stock movement history", description: "Click on any product row to see its full movement history: every receipt, pick, transfer, and adjustment." },
        ],
      },
      {
        title: "Making a stock adjustment",
        steps: [
          { title: "Find the product in Inventory", description: "Use the search or filter to locate the product you need to adjust." },
          { title: "Click Adjust", description: "The Adjust button opens a form for the product in the selected warehouse." },
          { title: "Enter the adjustment quantity and reason", description: "Positive number = adding stock (e.g. found extra units during a count). Negative number = removing stock (e.g. damaged units).", warning: "Adjustments are immediate and permanent. Double-check the quantity and reason before saving. Every adjustment is logged with your name and timestamp." },
          { title: "Select ADJUSTMENT as the movement type", description: "Adjustments are recorded as ADJUSTMENT type moves in the stock history." },
        ],
      },
      {
        title: "Setting reorder points",
        steps: [
          { title: "Open the Inventory page and find the product", description: "Locate the product-warehouse combination you want to configure." },
          { title: "Click Edit on the stock row", description: "Enter the reorder point (minimum level before reorder) and max level (upper bound for ordering)." },
          { title: "Save", description: "The reorder point is now active. Items at or below this level will be highlighted on the dashboard.", tip: "For fast-moving consumables like gloves or syringes, set a reorder point that gives you at least 2 weeks of buffer stock." },
        ],
      },
    ],
    faqs: [
      { q: "On hand shows 50 but we can only see 30 units on the shelf. What happened?", a: "Check the stock movement history for that product. Look for recent PICK movements — these reduce on hand when orders are delivered. Also check if any units are marked as Reserved (waiting for delivery)." },
      { q: "A product shows negative available stock. Is that possible?", a: "It shouldn't happen in normal operations. If it does, it usually means a manual adjustment was made incorrectly. Do a stock adjustment to correct it and investigate the cause." },
      { q: "Can two warehouses have different stock levels for the same product?", a: "Yes. Stock is tracked per product-warehouse combination. A product can have 100 units in Warehouse A and 20 in Warehouse B." },
    ],
  },

  // ─── 8. Inbound POs ──────────────────────────────────────────────────────────
  {
    slug: "inbound-pos",
    title: "Purchase Orders & Receiving",
    subtitle: "Create POs to suppliers and receive goods into stock",
    icon: "📥",
    roles: ["WAREHOUSE", "ADMIN"],
    overview:
      "When you need to replenish stock, you create an Inbound Purchase Order (PO) addressed to a supplier. Once the goods arrive, you receive them against the PO — recording how many units were accepted (good condition) and how many were damaged. Accepted units are immediately added to on-hand stock.",
    concepts: [
      { term: "Inbound PO", definition: "A purchase order sent to a supplier requesting product delivery to your warehouse." },
      { term: "PO Status", definition: "EXPECTED → RECEIVING → RECEIVED (or DELAYED if the supplier is late)." },
      { term: "Accepted", definition: "Units received in good condition and added to stock." },
      { term: "Damaged", definition: "Units received but not usable. Recorded for supplier claims but not added to stock." },
    ],
    workflows: [
      {
        title: "Creating a purchase order",
        steps: [
          { title: "Go to Purchase Orders → + New PO", description: "Navigate to the Purchase Orders (Inbound) page in the sidebar and click + New PO." },
          { title: "Select the supplier and warehouse", description: "Choose the supplier you are ordering from and the warehouse that will receive the goods." },
          { title: "Set the expected delivery date", description: "Enter when you expect the goods to arrive. This helps plan warehouse resources." },
          { title: "Add line items", description: "Add each product and the quantity ordered. Unit cost is optional but useful for inventory valuation." },
          { title: "Save the PO", description: "The PO is created with status EXPECTED. A PO number is assigned automatically (e.g. PO-2026-0001)." },
          { title: "Print the PO to send to the supplier", description: "Click Print PO to open the printable PO document. Share the PDF with your supplier.", tip: "Always get a confirmed delivery date from the supplier once they receive the PO." },
        ],
      },
      {
        title: "Receiving goods against a PO",
        steps: [
          { title: "Find the PO when goods arrive", description: "Go to Purchase Orders and find the PO with status EXPECTED. You can filter by status." },
          { title: "Open the PO and click Receive", description: "Click the PO to open its detail drawer, then click the Receive button." },
          { title: "Enter quantities received", description: "For each line, enter the Accepted quantity (good units) and Damaged quantity (defective or broken units).", warning: "Do not add damaged units to the accepted count. Damaged units are tracked separately and do not enter stock." },
          { title: "Save the receipt", description: "Accepted units are immediately added to on-hand stock in the selected warehouse. A RECEIPT stock movement is recorded." },
          { title: "Mark as RECEIVED when complete", description: "Once all lines have been received (or partially received with remaining units on backorder), update the PO status to RECEIVED." },
          { title: "Handle damaged goods", description: "For damaged units, file a claim with the supplier. Reference the PO number and damaged quantities from the PO record." },
        ],
      },
      {
        title: "Handling a delayed PO",
        steps: [
          { title: "Update the PO status to DELAYED", description: "If the supplier has notified you of a delay, open the PO and change the status to DELAYED." },
          { title: "Update the expected date", description: "Enter the new expected delivery date from the supplier." },
          { title: "Notify relevant teams", description: "If there are approved orders waiting on this stock, alert the Finance team so they can manage customer expectations.", tip: "Check the Inventory page for items with low available stock that are linked to DELAYED POs — these are the highest-risk situations." },
        ],
      },
    ],
    faqs: [
      { q: "I received goods but forgot to log it in the system. Can I backdate the receipt?", a: "Stock movements are dated at the time you enter them. You can add an adjustment with today's date and note it as a backdated receipt in the reason field. There is no way to change the timestamp." },
      { q: "A supplier sent more units than we ordered. Can I receive the extra?", a: "Yes — you can enter a higher quantity than the PO line. The stock will be added. Note the variance in the note field for your records." },
    ],
  },

  // ─── 9. Transfers ────────────────────────────────────────────────────────────
  {
    slug: "transfers",
    title: "Inter-Warehouse Transfers",
    subtitle: "Move stock between your warehouse locations",
    icon: "🔄",
    roles: ["WAREHOUSE", "ADMIN"],
    overview:
      "When you need to move stock from one warehouse to another — for example, balancing inventory between a main depot and a satellite location — you create a Transfer. The transfer tracks what was sent from the source and received at the destination.",
    concepts: [
      { term: "Transfer Status", definition: "DRAFT → IN_TRANSIT → RECEIVED." },
      { term: "Source Warehouse (From)", definition: "The warehouse sending the stock. Stock is deducted here." },
      { term: "Destination Warehouse (To)", definition: "The warehouse receiving the stock. Stock is added here." },
    ],
    workflows: [
      {
        title: "Creating and completing a transfer",
        steps: [
          { title: "Go to Inventory → Transfers (or via the Warehouse module)", description: "Find the Transfers section in the Warehouse or Inventory area." },
          { title: "Click + New Transfer", description: "Select the From warehouse and the To warehouse." },
          { title: "Add products and quantities", description: "For each product being transferred, enter the quantity to move." },
          { title: "Set status to IN_TRANSIT and record dispatch", description: "When the goods physically leave the source warehouse, update the transfer to IN_TRANSIT. Add an ETA for when the destination warehouse expects to receive." },
          { title: "Confirm receipt at the destination", description: "When the goods arrive at the destination warehouse, the receiving warehouse user updates the transfer to RECEIVED. Stock is decremented at source and incremented at destination.", warning: "Only mark RECEIVED when the goods have physically arrived and been counted. Stock changes are immediate and cannot be easily undone." },
        ],
      },
    ],
    faqs: [
      { q: "Can a transfer be cancelled mid-transit?", a: "Currently there is no cancel function for an IN_TRANSIT transfer. If goods are returned, you would need to create a reverse transfer (from destination back to source)." },
    ],
  },

  // ─── 10. Shipments ───────────────────────────────────────────────────────────
  {
    slug: "shipments",
    title: "Shipments & Delivery Tracking",
    subtitle: "Track outbound deliveries and record proof of delivery",
    icon: "🚚",
    roles: ["WAREHOUSE", "DRIVER", "FINANCE", "ADMIN"],
    overview:
      "Every order that reaches SHIPPED state has a Shipment record. The Shipments page is the central view for tracking what is currently in transit — which orders are on the road, with which courier, and when they are expected. Drivers use this page to confirm deliveries.",
    concepts: [
      { term: "Tracking Number", definition: "The courier's shipment tracking code. Enter this so customers and staff can track the parcel online." },
      { term: "ETA", definition: "Estimated time of arrival. Set when marking an order as shipped." },
      { term: "POD", definition: "Proof of Delivery. A document or photo confirming the customer received the goods. The POD URL field stores a link to this document." },
      { term: "Signed By", definition: "The name of the person at the customer's site who signed for the delivery." },
    ],
    workflows: [
      {
        title: "Recording shipment details",
        roles: ["WAREHOUSE", "ADMIN"],
        steps: [
          { title: "After marking an order as Shipped, go to the Shipments page", description: "The Shipments page lists all orders currently in SHIPPED state." },
          { title: "Find the shipment and click Edit", description: "Open the shipment row to add courier details." },
          { title: "Enter tracking number, courier name, and ETA", description: "Fill in the tracking number from your courier's system, the courier name, and the estimated delivery date.", tip: "For LBC, J&T, or other local couriers, the tracking number lets customers check delivery status directly on the courier's website." },
          { title: "Save the shipment details", description: "Details are visible to customers in their portal." },
        ],
      },
      {
        title: "Confirming delivery",
        roles: ["WAREHOUSE", "DRIVER", "FINANCE", "ADMIN"],
        steps: [
          { title: "Find the shipment in the Shipments list", description: "Filter by status SHIPPED to see all in-transit deliveries." },
          { title: "Record proof of delivery", description: "Enter the name of the person who signed for the goods and optionally a link to the signed DR (photo, Google Drive link, etc.) in the POD URL field." },
          { title: "Click Confirm Delivery on the linked order", description: "Navigate to the order detail and click Confirm Delivery. This moves the order to DELIVERED and triggers stock consumption.", note: "You can also confirm delivery directly from the order page without going through Shipments first." },
        ],
      },
      {
        title: "Printing a Delivery Receipt",
        steps: [
          { title: "Open the Shipments page and find the shipment", description: "Each shipment row has a print icon on the right side." },
          { title: "Click the print icon", description: "Opens the Delivery Receipt print page — a formal document for the customer to sign upon receipt.", tip: "Print the DR before dispatching. The customer or their representative signs it and returns a copy to your driver." },
        ],
      },
    ],
    faqs: [
      { q: "The driver delivered but the order wasn't marked SHIPPED first. What do I do?", a: "You cannot confirm delivery without going through the SHIPPED state. First mark the order as Shipped, then immediately confirm delivery." },
      { q: "Can I attach the signed delivery receipt as a file?", a: "Yes — use the Attachments panel on the order detail page to upload a scanned or photographed copy of the signed DR." },
    ],
  },

  // ─── 11. Returns ─────────────────────────────────────────────────────────────
  {
    slug: "returns",
    title: "Returns & RMA",
    subtitle: "Process return merchandise authorisations and manage dispositions",
    icon: "↩️",
    roles: ["AGENT", "WAREHOUSE", "FINANCE", "ADMIN"],
    overview:
      "Returns (also called RMAs — Return Merchandise Authorisations) handle situations where a customer sends products back: defective units, wrong items delivered, or excess quantities. The process ensures returned goods are properly inspected and either restocked (if saleable) or scrapped (if not), with full traceability.",
    concepts: [
      { term: "RMA Status", definition: "REQUESTED → APPROVED → RECEIVED → CLOSED." },
      { term: "Disposition", definition: "What happens to each returned item: RESTOCK (returned to saleable inventory) or SCRAP (written off)." },
      { term: "Qty Requested vs Qty Received", definition: "The customer may request to return 10 units but only 8 arrive. The system records both." },
    ],
    workflows: [
      {
        title: "Creating a return request",
        roles: ["AGENT", "FINANCE", "ADMIN"],
        steps: [
          { title: "Go to Returns / RMA → + New Return", description: "Click Returns in the sidebar and click '+ New Return'." },
          { title: "Select the original delivered order", description: "Only DELIVERED orders can have returns. The dropdown shows all delivered orders." },
          { title: "Enter the reason for return", description: "Be specific: 'Customer received wrong SKU', 'Unit arrived damaged', 'Excess order — customer only needed 5 of 10 ordered'." },
          { title: "Set quantities and disposition per line", description: "For each product being returned, enter how many units are coming back. Set disposition to RESTOCK if the units can be resold, or SCRAP if they are damaged/expired.", warning: "You cannot return more units than were in the original order line." },
          { title: "Submit the return request", description: "Status becomes REQUESTED. The Warehouse team is notified to expect incoming goods." },
        ],
      },
      {
        title: "Approving a return",
        roles: ["WAREHOUSE", "FINANCE", "ADMIN"],
        steps: [
          { title: "Review the return request", description: "Check the reason, the items, and the quantities. Verify with the customer if needed." },
          { title: "Click Approve", description: "Status changes to APPROVED. The warehouse team can now begin preparing to receive the goods." },
        ],
      },
      {
        title: "Receiving returned goods",
        roles: ["WAREHOUSE", "ADMIN"],
        steps: [
          { title: "When goods arrive, open the APPROVED return and click Receive", description: "The Receive modal shows each return line with the requested quantity." },
          { title: "Enter the actual quantity received for each line", description: "Count the incoming units. Enter the actual number received — it may be less than requested if the customer sent a partial return." },
          { title: "Confirm receipt", description: "Units marked RESTOCK are immediately added to on-hand stock in the original order's warehouse. A RETURN stock movement is recorded. SCRAP units are logged but do not enter stock." },
          { title: "Status becomes RECEIVED", description: "The return is now recorded. Finance can proceed with issuing a credit note or credit memo if applicable." },
        ],
      },
      {
        title: "Closing a return",
        roles: ["FINANCE", "ADMIN"],
        steps: [
          { title: "After all downstream actions (credit note, credit memo) are complete, close the return", description: "Click Close on a RECEIVED return." },
          { title: "Status becomes CLOSED", description: "Closed returns are kept for reference but no further action is required." },
        ],
      },
    ],
    faqs: [
      { q: "Does the system automatically issue a credit note when a return is received?", a: "No. The system records the return and restocks the inventory. Issuing a credit note or adjusting the invoice must be done manually in Accounting. This is intentional — not all returns result in a credit." },
      { q: "Can I create a return for an order that has already been invoiced?", a: "Yes. The invoice is separate from the return process. Handle the credit note or invoice adjustment in Accounting separately." },
    ],
  },

  // ─── 12. Equipment ───────────────────────────────────────────────────────────
  {
    slug: "equipment",
    title: "Equipment & Asset Registry",
    subtitle: "Track serialised equipment, maintenance intervals, and location",
    icon: "🔧",
    roles: ["WAREHOUSE", "ADMIN"],
    overview:
      "The Equipment module is a registry of all physical assets owned or managed by your company — patient monitors, ventilators, infusion pumps, and other medical equipment. Each asset has a unique serial number, a category, and a maintenance interval. This feeds into the PMS (work order) system for preventive maintenance scheduling.",
    concepts: [
      { term: "Asset", definition: "A serialised piece of equipment tracked individually (as opposed to consumables tracked by quantity)." },
      { term: "Serial Number", definition: "The manufacturer's unique identifier for this specific unit. Must be unique across all assets." },
      { term: "Category", definition: "Equipment type: PATIENT_MONITOR, VENTILATOR, INFUSION_PUMP, OXYGEN_CONCENTRATOR, DEFIBRILLATOR, MONITOR, or OTHER." },
      { term: "Maintenance Interval", definition: "How many days between required preventive maintenance. Default is 90 days." },
    ],
    workflows: [
      {
        title: "Adding a new asset to the registry",
        steps: [
          { title: "Go to Equipment → + New Asset", description: "Navigate to Equipment in the sidebar and click + New Asset." },
          { title: "Enter the asset name and serial number", description: "The name is a human-readable description (e.g. 'Mindray PM-900 Patient Monitor'). The serial number must be unique.", warning: "Double-check the serial number against the physical unit. This is the primary identifier used during maintenance and lease tracking." },
          { title: "Select the category and warehouse location", description: "Assign the asset to its current warehouse location so staff can find it." },
          { title: "Set the maintenance interval", description: "Enter how often (in days) this equipment requires preventive maintenance. Refer to the manufacturer's guidelines." },
          { title: "Enter purchase date (optional)", description: "Recording the purchase date helps with warranty tracking and asset lifecycle management." },
          { title: "Save the asset", description: "The asset now appears in the registry and can be linked to leases and work orders." },
        ],
      },
    ],
    faqs: [
      { q: "Can an asset be in two places at once?", a: "No. Each asset has a single warehouse location. Update the warehouse field when equipment moves to a different location." },
      { q: "We sold an asset to a customer outright. How do we record this?", a: "Currently there is no 'sold' status. You can note the sale in the asset name or create a work order with type DISPOSAL as a workaround. Full asset disposal tracking is planned for a future release." },
    ],
  },

  // ─── 13. Leases ──────────────────────────────────────────────────────────────
  {
    slug: "leases",
    title: "Equipment Leases",
    subtitle: "Manage equipment rental agreements with customers",
    icon: "📄",
    roles: ["FINANCE", "ADMIN"],
    overview:
      "The Leases module manages rental agreements where equipment is placed with a customer for a defined period at a monthly rate. Each lease links one or more assets (serialised equipment) to a customer, with a start date, end date, and monthly billing rate. Leases feed into the PMS — work orders for leased equipment can be linked to the relevant lease.",
    concepts: [
      { term: "Lease", definition: "A rental agreement between your company and a customer covering specific equipment for a defined period." },
      { term: "Monthly Rate", definition: "The recurring charge billed to the customer each month for the leased equipment." },
      { term: "Active", definition: "Whether the lease is currently in force. Inactive leases are historical records." },
      { term: "Lease Assets", definition: "The specific serialised equipment units covered by the lease." },
    ],
    workflows: [
      {
        title: "Creating a lease",
        steps: [
          { title: "Go to Leases → + New Lease", description: "Click Leases in the sidebar and click + New Lease." },
          { title: "Select the customer and set dates", description: "Choose the customer, then enter the start and end date of the rental agreement." },
          { title: "Enter the monthly rate", description: "This is the total monthly charge covering all equipment in this lease." },
          { title: "Link equipment (Lease Assets)", description: "Add the specific asset(s) included in this lease. You can link multiple assets to one lease (e.g. a patient monitor and its accessories).", tip: "Ensure the equipment is already in the Asset Registry before creating a lease." },
          { title: "Add notes if needed", description: "Notes are useful for contract reference numbers, special terms, or contact details." },
          { title: "Save the lease", description: "The lease is created as Active. The customer can see it in their portal under Leases & Equipment." },
        ],
      },
      {
        title: "Ending a lease",
        steps: [
          { title: "Open the lease record", description: "Find the lease in the Leases list." },
          { title: "Set Active to false (deactivate)", description: "Edit the lease and uncheck the Active toggle." },
          { title: "Update the end date if it was early termination", description: "Set the end date to the actual termination date." },
          { title: "Retrieve the equipment and update its warehouse location", description: "Go to Equipment, find the assets from this lease, and update their warehouse location back to your facility.", note: "Work orders linked to this lease remain for historical reference." },
        ],
      },
    ],
    faqs: [
      { q: "Can I generate invoices automatically for lease billing?", a: "Not yet — automatic monthly billing invoices are planned. Currently, Finance staff must manually create invoices for lease payments from the Accounting → AP tab or create a journal entry." },
    ],
  },

  // ─── 14. PMS / Work Orders ───────────────────────────────────────────────────
  {
    slug: "pms",
    title: "Work Orders & Preventive Maintenance",
    subtitle: "Schedule and track equipment maintenance and service calls",
    icon: "🛠️",
    roles: ["TECHNICIAN", "WAREHOUSE", "ADMIN"],
    overview:
      "The PMS (Preventive Maintenance System) manages work orders for equipment servicing. A work order can be preventive (scheduled maintenance) or corrective (fixing a problem). Technicians receive work orders, update their progress, and write notes. Work orders can be linked to a specific asset and optionally to a lease (for equipment on rental).",
    concepts: [
      { term: "Work Order", definition: "A task to inspect, maintain, or repair a specific piece of equipment." },
      { term: "WO Type", definition: "PREVENTIVE (scheduled regular maintenance) or CORRECTIVE (repairing a fault)." },
      { term: "Priority", definition: "LOW, MEDIUM, HIGH, or URGENT. Urgent work orders should be addressed within 24 hours." },
      { term: "Status", definition: "PENDING → IN_PROGRESS → NEEDS_PARTS → COMPLETED." },
      { term: "NEEDS_PARTS", definition: "The technician has paused work because spare parts are required. This triggers procurement to source the parts." },
      { term: "Kiosk Board", definition: "A full-screen view designed for display on a tablet or monitor in the workshop, showing all active work orders." },
    ],
    workflows: [
      {
        title: "Creating a work order",
        roles: ["WAREHOUSE", "ADMIN"],
        steps: [
          { title: "Go to PMS / Work Orders → + New Work Order", description: "Navigate to PMS in the sidebar and click + New Work Order." },
          { title: "Select the asset", description: "Choose the specific equipment unit this work order is for. The serial number is shown to help identify the right unit." },
          { title: "Set type, priority, and due date", description: "For preventive maintenance, type is PREVENTIVE and priority is usually LOW or MEDIUM. For urgent repairs, use CORRECTIVE and HIGH or URGENT." },
          { title: "Assign a technician", description: "Select the technician from the dropdown. They will see this work order on their dashboard.", tip: "Keep technician assignments current. Unassigned work orders may be overlooked." },
          { title: "Link to a lease (optional)", description: "If the equipment is on lease to a customer, link the lease so you have full context." },
          { title: "Write a clear title", description: "Good title examples: 'Annual PM — Mindray PM-900 SN12345', 'Replace battery — Infusion pump SN78901'." },
        ],
      },
      {
        title: "Working on a work order (Technician)",
        steps: [
          { title: "Open your assigned work orders", description: "Go to PMS. Your assigned work orders are listed. The Kiosk Board view (PMS → Kiosk Board) is useful if you're working at a bench." },
          { title: "Click Start (IN_PROGRESS)", description: "Click the status button to move the work order to IN_PROGRESS." },
          { title: "Add progress notes", description: "Use the Add Note button to write notes as you work: what you found, what you did, parts used. Notes are timestamped and signed with your name.", tip: "Write notes in real time, not from memory later. Detailed notes are essential for audit trails and warranty claims." },
          { title: "If parts are needed, set status to NEEDS_PARTS", description: "Click NEEDS_PARTS and add a note describing exactly what parts are required and from which supplier if known." },
          { title: "Complete the work order", description: "Once maintenance is complete, click COMPLETED. Add a final note summarising what was done.", warning: "Do not mark COMPLETED until all work is genuinely finished and the equipment has been tested." },
        ],
      },
      {
        title: "Using the Kiosk Board",
        steps: [
          { title: "Go to PMS → Kiosk Board", description: "The Kiosk Board opens in full-screen mode, designed for a workshop display." },
          { title: "Use it as a live task board", description: "Work orders are shown in columns by status: PENDING, IN_PROGRESS, NEEDS_PARTS, COMPLETED. Technicians can drag or click to update status directly from the board." },
          { title: "Mount a tablet or monitor in the workshop", description: "Navigate to the Kiosk Board URL on a device and leave it running. The board auto-refreshes.", tip: "Use a dedicated low-cost tablet for the kiosk. Log in as a TECHNICIAN role account." },
        ],
      },
    ],
    faqs: [
      { q: "How do I know when equipment is due for preventive maintenance?", a: "Work orders must currently be created manually. The system stores the maintenance interval on each asset, but automatic scheduling is a planned feature. As a workaround, create recurring work orders manually and set due dates based on the interval." },
      { q: "A technician left the company. How do I reassign their work orders?", a: "An Admin can edit each work order and reassign to a different technician. Go to PMS, filter by the departing technician, and update each open work order." },
    ],
  },

  // ─── 15. Accounting ──────────────────────────────────────────────────────────
  {
    slug: "accounting",
    title: "Accounting — Journal, AR, AP & BIR",
    subtitle: "Manage books, invoices, bills, payments, and tax filings",
    icon: "📒",
    roles: ["FINANCE", "ADMIN"],
    overview:
      "The Accounting module is the financial backbone of the system. It covers Accounts Receivable (AR — money owed to you by customers), Accounts Payable (AP — money you owe to suppliers), the General Ledger (a record of all financial transactions), and BIR filings (Philippine tax compliance). All transactions are double-entry: every peso in has a matching peso out.",
    concepts: [
      { term: "Journal Entry (JE)", definition: "A double-entry bookkeeping record. Every JE has at least two lines: one debit and one credit that must balance." },
      { term: "Debit (DR)", definition: "An entry that increases asset or expense accounts, or decreases liability or income accounts." },
      { term: "Credit (CR)", definition: "An entry that increases liability or income accounts, or decreases asset or expense accounts." },
      { term: "Accounts Receivable (AR)", definition: "Money customers owe you for delivered goods. Recorded when an invoice is generated." },
      { term: "Accounts Payable (AP)", definition: "Money you owe suppliers for purchased goods. Recorded as bills." },
      { term: "Chart of Accounts", definition: "The standardised list of account codes used in journal entries. e.g. 1100 = Accounts Receivable, 4000 = Sales Revenue, 2100 = VAT Payable." },
      { term: "Trial Balance", definition: "A summary of all account balances. The total of all debits must equal total credits. Used to verify the books are correct." },
      { term: "BIR", definition: "Bureau of Internal Revenue — the Philippine tax authority. The system tracks key BIR filing deadlines." },
    ],
    workflows: [
      {
        title: "Generating an invoice from a delivered order",
        steps: [
          { title: "Go to Accounting → AR tab", description: "The AR tab lists all invoices. Delivered orders without invoices are shown in the action items at the top." },
          { title: "Find the delivered order and click Generate Invoice", description: "Click the Generate Invoice button next to the order. A formal invoice is created immediately." },
          { title: "Review the posted journal entry", description: "The system automatically posts: DR Accounts Receivable (1100), CR Sales Revenue (4000), CR VAT Payable (2100)." },
          { title: "Share the invoice with the customer", description: "Click the print icon on the invoice row to open the printable invoice PDF. Send this to the customer.", tip: "Set net payment terms on the customer record (e.g. Net 30). The invoice due date is calculated automatically from these terms." },
        ],
      },
      {
        title: "Recording an invoice payment from a customer",
        steps: [
          { title: "Go to Accounting → AR tab", description: "Find the invoice you want to record a payment against." },
          { title: "Click Record Payment on the invoice row", description: "A payment modal appears." },
          { title: "Enter the payment amount", description: "For full payment, enter the full balance. For partial payment, enter what was actually received.", note: "The system posts DR Cash/Bank (1010), CR Accounts Receivable (1100) for the payment amount." },
          { title: "Confirm", description: "The invoice status updates to PARTIAL (if partially paid) or PAID (if fully settled). The customer's outstanding AR balance decreases accordingly, freeing up credit limit." },
        ],
      },
      {
        title: "Creating and paying a supplier bill",
        steps: [
          { title: "Go to Accounting → AP tab → + New Bill", description: "Create a bill when you receive a supplier invoice." },
          { title: "Enter bill details", description: "Select the supplier, enter the bill reference number, due date, and amount." },
          { title: "Record payment when you pay the supplier", description: "Find the bill and click Record Payment. Enter the amount paid.", note: "Payment posts: DR Accounts Payable (2000), CR Cash/Bank (1010)." },
        ],
      },
      {
        title: "Creating a manual journal entry",
        steps: [
          { title: "Go to Accounting → Journal tab → + Journal Entry", description: "Manual JEs are for transactions that don't have a dedicated module: salary payments, depreciation, bank charges, etc." },
          { title: "Set the date, source, reference, and memo", description: "Source options: AR, AP, BANK, PAYROLL, INV, GL, OPENING. Use GL for general adjustments." },
          { title: "Add debit and credit lines", description: "Add at least one DR line and one CR line. The totals must balance.", warning: "The system will not save an unbalanced journal entry. Total debits must equal total credits to the cent." },
          { title: "Save", description: "The entry is posted immediately and appears in the General Ledger." },
        ],
      },
      {
        title: "Managing BIR filings",
        steps: [
          { title: "Go to Accounting → BIR Filings tab", description: "Upcoming and overdue BIR filings are listed here." },
          { title: "Check due dates", description: "Filings with a red indicator are overdue or due soon. Prioritise these." },
          { title: "File via eFPS or manual submission", description: "Filing is done externally through the BIR's eFPS portal or manual submission. The system does not submit to BIR directly." },
          { title: "Mark as Filed in the system", description: "After filing, click the filing icon on the row, enter the eFPS reference number or confirmation, and mark as FILED.", tip: "Print the BIR form from the print icon (📄) on each filing row for your physical records." },
        ],
      },
    ],
    faqs: [
      { q: "I made a wrong journal entry. Can I delete it?", a: "No — journal entries cannot be deleted to preserve audit integrity. To correct an error, create a reversing journal entry (same accounts, same amounts, but debits and credits swapped) with a memo explaining the correction." },
      { q: "The trial balance doesn't balance. What do I check?", a: "Every system-generated entry (from invoice generation, payment recording) is guaranteed to balance. Imbalances usually come from manual journal entries where the totals don't match. Check the Journal tab and look for entries where the DR and CR amounts differ." },
      { q: "How do I record a customer paying via online bank transfer?", a: "Use Record Payment on the invoice. The system records it as DR Cash/Bank (account 1010). If you want to split by bank account (BDO vs BPI), use a manual journal entry with the specific account code." },
    ],
  },

  // ─── 16. Reports ─────────────────────────────────────────────────────────────
  {
    slug: "reports",
    title: "Reports & Data Exports",
    subtitle: "Analyse sales, receivables, inventory, and profitability",
    icon: "📈",
    roles: ["FINANCE", "ADMIN"],
    overview:
      "The Reports module provides five built-in report types covering the main areas of the business. Reports can be filtered by date range and exported to CSV (for Excel analysis) or printed as PDF. All report data is computed live from the database at the time you run them.",
    concepts: [
      { term: "Sales Report", definition: "Monthly revenue breakdown from delivered orders, with top customers ranking." },
      { term: "AR Aging", definition: "Outstanding invoices grouped by how overdue they are: Current, 1–30 days, 31–60 days, 61–90 days, 90+ days." },
      { term: "Inventory Report", definition: "Current stock snapshot: on-hand, reserved, available, and value per product per warehouse." },
      { term: "PO Summary", definition: "List of purchase orders in the selected period with status and totals." },
      { term: "P&L (Profit & Loss)", definition: "Revenue and expense summary from the general ledger, showing gross profit and net income." },
    ],
    workflows: [
      {
        title: "Running a report",
        steps: [
          { title: "Go to Reports in the sidebar", description: "Click Reports. The report builder page opens." },
          { title: "Select a report type", description: "Click one of the five report type cards: Sales, AR Aging, Inventory, PO Summary, or P&L." },
          { title: "Set the date range (for Sales and PO Summary)", description: "Enter from and to dates. The report updates automatically when you move focus out of the date field." },
          { title: "Review the summary KPIs", description: "Each report shows key metrics at the top — total revenue, total outstanding, etc." },
          { title: "Review the detail table", description: "The data table below the KPIs shows the full detail. Scroll horizontally if needed for wide reports." },
        ],
      },
      {
        title: "Exporting to CSV",
        steps: [
          { title: "Run the report as described above", description: "Set the type and date range." },
          { title: "Click Export CSV", description: "A CSV file downloads immediately. The filename includes the report type and date." },
          { title: "Open in Excel", description: "Open the CSV in Excel. The file uses UTF-8 encoding with BOM to correctly display Philippine peso amounts and special characters.", tip: "In Excel, use Data → Get Data → From Text/CSV if the file opens with garbled characters." },
        ],
      },
      {
        title: "Printing a report",
        steps: [
          { title: "Run the report", description: "Set type and date range." },
          { title: "Click Print Report", description: "Opens a print-ready version of the report in a new tab with your company header and date." },
          { title: "Save as PDF", description: "Use browser print → Save as PDF. The report is formatted for A4." },
        ],
      },
    ],
    faqs: [
      { q: "The P&L shows no data. Why?", a: "The P&L is built from journal entries. If no journal entries have been posted, it will be empty. Ensure invoices have been generated and payments recorded through the Accounting module." },
      { q: "The AR Aging report shows an invoice I know is paid. Why?", a: "The payment may not have been recorded in the system. Go to Accounting → AR and record the payment on the invoice. The aging report will update immediately." },
      { q: "Can I schedule a report to run automatically each month?", a: "Automatic report scheduling is not yet available. Run reports manually and export to CSV for distribution." },
    ],
  },

  // ─── 17. Customers & Suppliers ───────────────────────────────────────────────
  {
    slug: "customers-suppliers",
    title: "Customers & Suppliers",
    subtitle: "Manage your trading partner master data",
    icon: "🤝",
    roles: ["AGENT", "FINANCE", "WAREHOUSE", "ADMIN"],
    overview:
      "Customers and Suppliers are the master records for everyone you trade with. Getting these records accurate is important — the customer's credit limit, payment terms, and contact email all drive real business logic (credit checks, invoice due dates, email notifications). Supplier data drives purchasing and bill management.",
    concepts: [
      { term: "Customer Code", definition: "A short internal reference code (e.g. 'MCH-001' for Metro City Hospital). Used on reports and documents." },
      { term: "TIN", definition: "Tax Identification Number. Required for BIR compliance and appearing on formal documents." },
      { term: "Payment Terms", definition: "How long the customer has to pay after invoice. Common values: Net 30, Net 60, COD. Determines invoice due dates." },
      { term: "Contact Email", definition: "The primary email address for this customer. Order status change emails and quotation emails are sent here." },
      { term: "Supplier Rating", definition: "A star rating (1–5) for the supplier's reliability, quality, and service. Used for vendor evaluation." },
      { term: "Lead Time", definition: "The supplier's typical number of days from PO to delivery. Used for planning reorders." },
    ],
    workflows: [
      {
        title: "Creating a new customer",
        roles: ["AGENT", "FINANCE", "ADMIN"],
        steps: [
          { title: "Go to Customers → + New Customer", description: "Navigate to the Customers page and click + New Customer." },
          { title: "Fill in name, code, and type", description: "Type is usually HOSPITAL but can be CLINIC, GOVERNMENT, or other classification used in reporting." },
          { title: "Enter TIN if available", description: "TIN appears on invoices. Required for government and corporate customers." },
          { title: "Set payment terms", description: "Enter the agreed terms (e.g. 'Net 30'). This controls invoice due date calculation." },
          { title: "Set credit limit", description: "Enter the maximum outstanding balance allowed in pesos. Set to 0 for no limit.", warning: "Setting a credit limit too high exposes you to bad debt risk. Set limits based on the customer's payment history and financial standing." },
          { title: "Enter contact email", description: "This email receives all system notifications for orders and invoices. Make sure it is the right person (usually the purchasing or AP contact, not the doctor)." },
          { title: "Save", description: "The customer is now available when creating orders and quotations." },
        ],
      },
      {
        title: "Creating a new supplier",
        roles: ["WAREHOUSE", "FINANCE", "ADMIN"],
        steps: [
          { title: "Go to Suppliers → + New Supplier", description: "Navigate to the Suppliers page and click + New Supplier." },
          { title: "Enter name, code, and contact details", description: "The supplier code is an internal reference. Contact email is used for PO notifications." },
          { title: "Set payment terms and lead time", description: "Payment terms (Net 30, etc.) and typical lead time in days for planning purposes." },
          { title: "Set an initial rating", description: "Rate the supplier from 1 to 5 stars based on your experience. You can update this over time." },
          { title: "Save", description: "The supplier is now available when creating inbound POs and bills." },
        ],
      },
      {
        title: "Exporting customers or suppliers to CSV",
        steps: [
          { title: "Go to Customers (or Suppliers) page", description: "Navigate to the respective list page." },
          { title: "Click Export CSV", description: "A CSV file with all customer or supplier records downloads immediately." },
        ],
      },
    ],
    faqs: [
      { q: "Can a customer also have a portal login?", a: "Yes. Go to Settings → Users and create a user with the CUSTOMER role, then link it to the customer record via the 'Customer' field. That user can then log in and see only their own orders, invoices, and quotes." },
      { q: "A supplier has changed their contact details. Do I need to update historical POs?", a: "No — updating the supplier record updates future references only. Historical POs and bills retain the data as it was at time of creation." },
    ],
  },

  // ─── 18. Customer Portal ─────────────────────────────────────────────────────
  {
    slug: "customer-portal",
    title: "Customer Portal",
    subtitle: "Self-service access for your customers to track orders and invoices",
    icon: "🌐",
    roles: ["CUSTOMER"],
    overview:
      "The Customer Portal is a dedicated view for your customers. They log in with their own credentials and see only their data — orders, invoices, quotations, and leased equipment. It reduces inbound calls about order status and gives customers a professional, modern experience. Customers cannot see any other customer's data.",
    concepts: [
      { term: "Portal Account", definition: "A user account with CUSTOMER role, linked to a specific customer record. Set up by your Administrator." },
      { term: "Open AR", definition: "The total of unpaid invoice balances. Shown as a credit utilisation bar at the top of the portal." },
      { term: "Order Status", definition: "Real-time status of each order: PENDING, APPROVED, PREPARING, SHIPPED, DELIVERED." },
    ],
    workflows: [
      {
        title: "Logging into the portal",
        steps: [
          { title: "Use the URL provided by your supplier", description: "Navigate to the application URL. The login page appears automatically." },
          { title: "Enter your email and password", description: "Use the credentials provided to you. If you have not received them, contact your supplier's sales team." },
          { title: "You land on the Customer Portal overview", description: "You see your company name, credit utilisation, recent orders, and outstanding invoices at a glance." },
        ],
      },
      {
        title: "Checking the status of an order",
        steps: [
          { title: "Click the 'My orders' tab", description: "All your recent orders are listed with their current status." },
          { title: "Click any order to expand it", description: "Expanding an order shows the full list of items ordered, quantities, and unit prices." },
          { title: "Check shipment tracking if available", description: "Shipped orders show the courier name and tracking number. Use the tracking number on the courier's website to check delivery status.", note: "Not all orders have tracking numbers — contact your supplier if tracking is not showing for a shipped order." },
        ],
      },
      {
        title: "Viewing and downloading invoices",
        steps: [
          { title: "Click the 'Invoices' tab", description: "All invoices are listed with amount, due date, amount paid, and status." },
          { title: "Check for overdue invoices", description: "Invoices past their due date are highlighted. Coordinate with your accounts payable team to settle these.", tip: "Settling invoices promptly keeps your credit utilisation low, which avoids order delays when you're near your credit limit." },
          { title: "Click the print icon to download an invoice PDF", description: "Each invoice row has a print icon. Click it to open the formal invoice for your records or for payment processing." },
        ],
      },
      {
        title: "Viewing quotations",
        steps: [
          { title: "Click the 'Quotations' tab", description: "Quotations sent to you by the supplier appear here." },
          { title: "Check the validity date", description: "Prices are only valid until the date shown. If a quotation is near expiry and you want to proceed, contact your supplier immediately." },
          { title: "Click View PDF to download the proforma invoice", description: "The proforma invoice PDF can be used to raise an internal purchase order with your finance team.", tip: "Your supplier needs your internal PO number before they can process your order. Send them the PO reference once it's raised." },
        ],
      },
      {
        title: "Placing a new order",
        steps: [
          { title: "Click + New Order in the portal header", description: "This opens the standard order creation form." },
          { title: "Add your items and submit", description: "Select products, quantities, and add any special delivery instructions in the Notes field." },
          { title: "Your order enters PENDING status", description: "Your supplier's finance team will review and approve it. You will receive an email notification as the order progresses.", note: "If your order is not approved within one business day, follow up with your supplier contact." },
        ],
      },
    ],
    faqs: [
      { q: "I can't see a quotation that my supplier said they sent. Why?", a: "Check the Quotations tab. Only SENT, ACCEPTED, and CONVERTED quotations are visible in the portal. If your supplier created a quote but hasn't sent it yet (still DRAFT), it won't appear. Ask them to send it." },
      { q: "My credit utilisation bar shows red even though I think I've paid. Why?", a: "The bar reflects your outstanding invoice balance as recorded in the supplier's system. If you have paid but it's still showing, contact your supplier — they may not have recorded the payment yet." },
      { q: "I see an invoice for an order I don't recognise. What should I do?", a: "Contact your supplier immediately. Do not pay an invoice for an order you did not place." },
    ],
  },

];

// ── Quick-start paths by role ─────────────────────────────────────────────────

export interface QuickStart {
  role: HelpRole;
  label: string;
  description: string;
  color: string;
  steps: { title: string; slug: string; description: string }[];
}

export const QUICK_STARTS: QuickStart[] = [
  {
    role: "AGENT",
    label: "Sales Agent",
    description: "Start here if your job is managing customer relationships and creating orders",
    color: "#2563eb",
    steps: [
      { title: "Understand the system", slug: "getting-started", description: "Login, navigation, and your role" },
      { title: "Learn the order lifecycle", slug: "sales-orders", description: "Create an order from scratch to delivery" },
      { title: "Send quotations", slug: "quotations", description: "Create proforma invoices and convert to orders" },
      { title: "Manage customers", slug: "customers-suppliers", description: "Customer records, credit limits, and contacts" },
      { title: "Understand credit limits", slug: "credit-limits", description: "What to do when a customer is over limit" },
    ],
  },
  {
    role: "FINANCE",
    label: "Finance",
    description: "Start here if your job is approvals, invoicing, payments, and reporting",
    color: "#16a34a",
    steps: [
      { title: "Understand the system", slug: "getting-started", description: "Login, navigation, and your role" },
      { title: "Process order approvals", slug: "approvals", description: "Review and approve pending orders" },
      { title: "Manage credit limits", slug: "credit-limits", description: "Set limits and handle overrides" },
      { title: "Handle AR and AP", slug: "accounting", description: "Invoices, payments, bills, journal entries, BIR" },
      { title: "Run reports", slug: "reports", description: "Sales, aging, inventory, and P&L reports" },
    ],
  },
  {
    role: "WAREHOUSE",
    label: "Warehouse",
    description: "Start here if your job is picking, packing, receiving, and stock management",
    color: "#d97706",
    steps: [
      { title: "Understand the system", slug: "getting-started", description: "Login, navigation, and your role" },
      { title: "Pick and ship orders", slug: "sales-orders", description: "Advance orders from Approved to Shipped to Delivered" },
      { title: "Manage stock levels", slug: "inventory", description: "On hand, reserved, adjustments, and reorder points" },
      { title: "Receive purchase orders", slug: "inbound-pos", description: "Receive goods from suppliers and update stock" },
      { title: "Handle returns", slug: "returns", description: "Receive returned goods and decide restock or scrap" },
    ],
  },
  {
    role: "CUSTOMER",
    label: "Customer",
    description: "Start here if you are a customer accessing the portal to track orders",
    color: "#7c3aed",
    steps: [
      { title: "Log in to the portal", slug: "customer-portal", description: "First login and portal overview" },
      { title: "Track your orders", slug: "customer-portal", description: "Order status, shipment tracking, and delivery" },
      { title: "View your invoices", slug: "customer-portal", description: "Download invoices and check payment status" },
      { title: "View quotations", slug: "customer-portal", description: "Review proforma invoices from your supplier" },
    ],
  },
];
