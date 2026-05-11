import { describe, it, expect } from "vitest";
import { orderTotal, vatOf, cwtOf, shortPeso } from "@/lib/utils";

describe("vatOf", () => {
  it("computes 12% VAT", () => {
    expect(vatOf(1000)).toBe(120);
  });

  it("respects custom rate", () => {
    expect(vatOf(1000, 0.05)).toBe(50);
  });
});

describe("cwtOf", () => {
  it("returns 0 when not applied", () => {
    expect(cwtOf(1000, 0.02, false)).toBe(0);
  });

  it("returns 2% when applied", () => {
    expect(cwtOf(1000, 0.02, true)).toBe(20);
  });
});

describe("orderTotal", () => {
  it("computes subtotal + VAT without CWT", () => {
    const { total } = orderTotal(1000, false);
    expect(total).toBe(1120);
  });

  it("computes subtotal + VAT - CWT with cwt2307", () => {
    const { total } = orderTotal(1000, true);
    expect(total).toBe(1100); // 1000 + 120 - 20
  });
});

describe("shortPeso", () => {
  it("formats millions", () => {
    expect(shortPeso(1_500_000)).toBe("₱1.5M");
  });

  it("formats thousands", () => {
    expect(shortPeso(12_500)).toBe("₱13K");
  });

  it("formats small values without suffix", () => {
    expect(shortPeso(500)).toBe("₱500");
  });
});
