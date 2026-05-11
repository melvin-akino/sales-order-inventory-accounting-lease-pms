import { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/dashboard|orders|inventory/);
}

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@medisupply.ph",
  password: process.env.E2E_ADMIN_PASS ?? "admin123",
};

export const FINANCE = {
  email: process.env.E2E_FINANCE_EMAIL ?? "finance@medisupply.ph",
  password: process.env.E2E_FINANCE_PASS ?? "finance123",
};

export const WAREHOUSE = {
  email: process.env.E2E_WAREHOUSE_EMAIL ?? "warehouse@medisupply.ph",
  password: process.env.E2E_WAREHOUSE_PASS ?? "warehouse123",
};
