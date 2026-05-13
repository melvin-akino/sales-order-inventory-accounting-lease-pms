# Business Requirements Document (BRD) & Commercial Proposal
**Project Name:** MediSupply ERP (Sales, Inventory, Accounting, Lease & PMS)  
**Document Type:** Business Requirements Document & Technical Proposal  
**Date:** May 13, 2026  

---

## 1. Executive Summary
MediSupply ERP is a comprehensive, full-stack enterprise resource planning system tailored specifically for Philippine medical supply distributors. The system aims to centralize and automate the entire order-to-cash and procure-to-pay lifecycles. By integrating sales order management, multi-warehouse inventory tracking, equipment leasing, preventive maintenance (PMS), and full double-entry accounting with localized BIR compliance, this solution will drastically reduce manual bottlenecks, ensure regulatory compliance, and deliver real-time operational visibility.

At a fixed investment of **₱350,000**, this system delivers enterprise-grade capabilities typically found in multi-million-peso platforms, providing an exceptional return on investment through operational efficiency and robust automation.

---

## 2. Core System Modules (18 Modules)
The system is divided into 18 highly cohesive core modules, accessible via role-based access control (RBAC):

1. **Dashboard:** Role-specific KPIs, real-time revenue trend charts, and operational summaries for Executives, Finance, Warehouse, and Agents.
2. **Sales Orders:** End-to-end order lifecycle management with a built-in state machine (`PENDING → APPROVED → PREPARING → SHIPPED → DELIVERED`). Includes automated VAT (12%) and CWT (2%) computation.
3. **Approvals:** Dedicated finance approval queue with complete audit trails to enforce financial governance before fulfillment.
4. **Warehouse:** Kanban board interfaces for streamlined pick/pack operations across multiple warehouse locations.
5. **Shipments:** Comprehensive shipment tracking, courier assignment, delivery confirmations, and Proof of Delivery (POD) signature uploads.
6. **Purchase Orders (Inbound):** PO creation, expected arrival tracking, and robust goods receipt capabilities including damage tracking and automated stock updates.
7. **Inventory:** Real-time stock visibility across multi-warehouse setups, with reorder level alerts, visual flags, and complete stock move history with unit cost tracking.
8. **Leases:** Management of equipment lease agreements, monthly billing cycles, and contract status tracking for long-term customer engagements.
9. **PMS / Work Orders:** Preventive Maintenance System featuring work order CRUD, Kanban workflows, and a full-screen Technician Kiosk mode for on-floor execution.
10. **Equipment:** Unified asset registry tracking serial numbers, models, locations, and comprehensive maintenance histories linked directly to work orders.
11. **Catalog:** Centralized Product/SKU management system governing pricing, unit of measure, and branding.
12. **Customers:** A lightweight CRM for managing customer relationships, credit limits, TINs, payment terms, and region mapping.
13. **Suppliers:** Supplier database with lead time tracking and performance rating capabilities.
14. **Accounting (Ledger):** A complete double-entry ledger system featuring a 35-account Philippine-flavored Chart of Accounts (COA). Includes Accounts Receivable (AR), Accounts Payable (AP), automatic Trial Balance generation, and integrated BIR tax compliance (2550M, 2550Q, 1601C, etc.).
15. **Reports:** Configurable report builder for Sales Summaries, AR Aging, Inventory Snapshots, PO Summaries, and live P&L statements with CSV/PDF exports.
16. **Activity Log:** A unified, immutable audit feed tracking order transitions, stock moves, journal entries, and work order notes.
17. **Customer Portal:** A self-service portal empowering customers to track their own orders and view outstanding invoices without tying up customer service agents.
18. **Settings:** Administrative control panel for user management, role assignments, system configuration, and organizational branding.

---

## 3. Cross-Cutting Features & Help System

To ensure seamless adoption and maintainability, the system is reinforced by robust cross-cutting capabilities:

*   **Role-Based Access Control (RBAC):** 7 distinct roles (`ADMIN`, `FINANCE`, `AGENT`, `WAREHOUSE`, `TECHNICIAN`, `DRIVER`, `CUSTOMER`) ensuring data security and proper workflow routing.
*   **Integrated Help System & Onboarding:** Contextual tooltips, inline documentation, and guided walkthroughs for complex processes (like Journal Entries and BIR filings) to reduce training time and minimize user errors.
*   **Real-Time Notifications:** In-app alerts tailored to roles (e.g., Finance alerted for overdue invoices, Warehouse alerted for low stock and pending PO arrivals).
*   **Print & Export Engine:** Native browser-based document generation for Order Confirmations, Delivery Receipts, POs, Invoices, and BIR forms. Comprehensive CSV export functionality across all data grids.

---

## 4. Quality Assurance & Automated Testing

To guarantee zero regressions in mission-critical financial and operational logic, the system employs a rigorous, multi-layered automated testing strategy:

*   **Unit & Integration Testing (Vitest):** Fast, highly focused testing covering critical business logic, automated VAT/CWT calculations, and complex Chart of Account (COA) trial balance computations.
*   **End-to-End Testing (Playwright):** Browser-based workflow automation ensuring the user journey—from order creation and finance approval to fulfillment and invoicing—functions flawlessly across different roles.
*   **CI/CD Readiness:** Automated test execution on every build, ensuring that new features do not break existing ERP stability.

---

## 5. Technical Architecture

*   **Frontend & API:** Next.js 14 App Router for a lightning-fast, highly responsive user interface with Server Actions to eliminate redundant API layers.
*   **Database:** PostgreSQL managed via Prisma ORM for uncompromising transactional integrity, relational consistency, and type-safe queries.
*   **Styling:** Tailwind CSS integrated with a dynamic CSS custom properties system to deliver a beautiful, modern, and highly usable interface.
*   **Deployment:** Fully Dockerized architecture (`docker-compose`) ensuring consistent parity between development, testing, and production environments.

---

## 6. Commercial Proposal & Cost Breakdown

The table below outlines the estimated effort and standard market rates for a system of this magnitude. 

| Scope | Est. Hours | Rate | Cost |
| :--- | :--- | :--- | :--- |
| **Core Modules (18 modules)** | 300–400 hrs | ₱700/hr | ₱210,000 – ₱280,000 |
| **Cross-cutting features & Help System** | 80–120 hrs | ₱700/hr | ₱56,000 – ₱84,000 |
| **DB design, Automated Tests & Seeding** | 20–30 hrs | ₱700/hr | ₱14,000 – ₱21,000 |
| **Total Estimated Value** | **400–550 hrs** | | **₱280,000 – ₱385,000** |

### **Special Pricing: ₱350,000**

**Why this is an exceptional value:**
At **₱350,000**, you are acquiring a bespoke, enterprise-ready ERP specifically tailored to the nuances of the Philippine medical supply chain and BIR tax codes. Off-the-shelf software (like SAP or NetSuite) typically demands massive licensing fees, monthly subscriptions, and extensive custom integration costs that easily exceed ₱1M+ in the first year alone. 

This pricing provides a complete, modern tech stack with no vendor lock-in, inclusive of comprehensive automated test coverage and a highly scalable architecture that will grow with your business operations.
