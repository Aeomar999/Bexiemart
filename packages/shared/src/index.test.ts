import type { User, AuthResponse, ApiResponse, PaginatedResponse, OrderStatus, PaymentStatus, WalletStatus, TransactionType, TransactionStatus } from "./index";

describe("shared types and enums", () => {
  it("should have OrderStatus with expected string values", () => {
    const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
    expect(statuses).toHaveLength(7);
    expect(statuses).toContain("pending");
    expect(statuses).toContain("delivered");
    expect(statuses).toContain("refunded");
  });

  it("should have PaymentStatus with expected string values", () => {
    const statuses: PaymentStatus[] = ["pending", "success", "failed", "refunded"];
    expect(statuses).toHaveLength(4);
    expect(statuses).toContain("success");
    expect(statuses).toContain("refunded");
  });

  it("should have WalletStatus with expected string values", () => {
    const statuses: WalletStatus[] = ["active", "frozen", "suspended"];
    expect(statuses).toHaveLength(3);
    expect(statuses).toContain("active");
    expect(statuses).toContain("suspended");
  });

  it("should have TransactionType and TransactionStatus with all variants", () => {
    const types: TransactionType[] = ["topup", "withdrawal", "transfer_sent", "transfer_received", "order_payment", "earnings", "reversal", "fee"];
    expect(types).toHaveLength(8);
    const tStatuses: TransactionStatus[] = ["pending", "completed", "failed", "reversed"];
    expect(tStatuses).toHaveLength(4);
    expect(tStatuses).toContain("reversed");
  });
});
