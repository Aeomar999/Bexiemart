import { NotFoundException } from "@nestjs/common";
import { mockPrisma } from "../../prisma/prisma.mock";
import { VendorPaymentMethodsService } from "./vendor-payment-methods.service";

describe("VendorPaymentMethodsService", () => {
  let service: VendorPaymentMethodsService;
  let prisma: ReturnType<typeof mockPrisma>;

  const bankRow = {
    id: "b-1",
    walletId: "w-1",
    bankName: "GTBank",
    bankCode: "123",
    accountNumber: "0123456789",
    accountName: "Test",
    paystackRecipientCode: "RCP_secret",
    isDefault: true,
    isVerified: false,
    createdAt: new Date(),
  };
  const momoRow = {
    id: "m-1",
    walletId: "w-1",
    provider: "MTN",
    phoneNumber: "0240000123",
    accountName: "Test",
    paystackRecipientCode: "RCP_secret",
    isDefault: true,
    isVerified: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    prisma = mockPrisma();
    prisma.$transaction.mockImplementation((ops: any) => Promise.all(ops));
    service = new VendorPaymentMethodsService(prisma as any);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should find all payment methods", async () => {
    prisma.wallet.findUnique.mockResolvedValue({ id: "w-1" } as any);
    prisma.bankAccount.findMany.mockResolvedValue([]);
    prisma.momoAccount.findMany.mockResolvedValue([]);
    const result = await service.findAll("user-1");
    expect(result.bankAccounts).toEqual([]);
    expect(result.momoAccounts).toEqual([]);
  });

  it("should mask account numbers when listing payment methods", async () => {
    prisma.wallet.findUnique.mockResolvedValue({ id: "w-1" } as any);
    prisma.bankAccount.findMany.mockResolvedValue([bankRow]);
    prisma.momoAccount.findMany.mockResolvedValue([momoRow]);
    const result = await service.findAll("user-1");
    expect(result.bankAccounts[0].accountNumber).toBe("******6789");
    expect(result.momoAccounts[0].phoneNumber).toBe("******0123");
    expect(result.bankAccounts[0]).not.toHaveProperty("paystackRecipientCode");
    expect(result.momoAccounts[0]).not.toHaveProperty("paystackRecipientCode");
  });

  it("should add a bank account and return it masked", async () => {
    prisma.wallet.findUnique.mockResolvedValue(null);
    prisma.wallet.create.mockResolvedValue({ id: "w-1" } as any);
    prisma.bankAccount.count.mockResolvedValue(0);
    prisma.bankAccount.create.mockResolvedValue(bankRow);
    const result = await service.addBank("user-1", {
      bankName: "GTBank",
      bankCode: "123",
      accountNumber: "0123456789",
      accountName: "Test",
    });
    expect(result).toEqual({
      id: "b-1",
      type: "bank",
      bankName: "GTBank",
      bankCode: "123",
      accountNumber: "******6789",
      accountName: "Test",
      isDefault: true,
      isVerified: false,
    });
  });

  it("should add a momo account and return it masked", async () => {
    prisma.wallet.findUnique.mockResolvedValue(null);
    prisma.wallet.create.mockResolvedValue({ id: "w-1" } as any);
    prisma.momoAccount.findUnique.mockResolvedValue(null);
    prisma.momoAccount.count.mockResolvedValue(0);
    prisma.momoAccount.create.mockResolvedValue(momoRow);
    const result = await service.addMomo("user-1", {
      provider: "MTN",
      phoneNumber: "0240000123",
      accountName: "Test",
    });
    expect(result).toEqual({
      id: "m-1",
      type: "momo",
      provider: "MTN",
      phoneNumber: "******0123",
      accountName: "Test",
      isDefault: true,
      isVerified: false,
    });
  });

  it("should remove a payment method", async () => {
    prisma.wallet.findUnique.mockResolvedValue({ id: "w-1" } as any);
    prisma.bankAccount.findFirst.mockResolvedValue({ id: "b-1", walletId: "w-1" } as any);
    prisma.bankAccount.delete.mockResolvedValue({} as any);
    const result = await service.remove("user-1", "bank", "b-1");
    expect(result).toEqual({ success: true });
  });

  describe("setDefault", () => {
    beforeEach(() => {
      prisma.wallet.findUnique.mockResolvedValue({ id: "w-1" } as any);
    });

    it("should set an owned bank account as default", async () => {
      prisma.bankAccount.findFirst.mockResolvedValue(bankRow);
      const result = await service.setDefault("user-1", "bank", "b-1");
      expect(result).toEqual({ success: true });
      expect(prisma.bankAccount.findFirst).toHaveBeenCalledWith({
        where: { id: "b-1", walletId: "w-1" },
      });
      expect(prisma.bankAccount.updateMany).toHaveBeenCalledWith({
        where: { walletId: "w-1" },
        data: { isDefault: false },
      });
      expect(prisma.bankAccount.update).toHaveBeenCalledWith({
        where: { id: "b-1" },
        data: { isDefault: true },
      });
    });

    it("should set an owned momo account as default", async () => {
      prisma.momoAccount.findFirst.mockResolvedValue(momoRow);
      const result = await service.setDefault("user-1", "momo", "m-1");
      expect(result).toEqual({ success: true });
      expect(prisma.momoAccount.findFirst).toHaveBeenCalledWith({
        where: { id: "m-1", walletId: "w-1" },
      });
      expect(prisma.momoAccount.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: { isDefault: true },
      });
    });

    it("should reject a bank account owned by another wallet without touching any rows", async () => {
      prisma.bankAccount.findFirst.mockResolvedValue(null);
      await expect(service.setDefault("user-1", "bank", "someone-elses-bank")).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.bankAccount.findFirst).toHaveBeenCalledWith({
        where: { id: "someone-elses-bank", walletId: "w-1" },
      });
      expect(prisma.bankAccount.update).not.toHaveBeenCalled();
      expect(prisma.bankAccount.updateMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("should reject a momo account owned by another wallet without touching any rows", async () => {
      prisma.momoAccount.findFirst.mockResolvedValue(null);
      await expect(service.setDefault("user-1", "momo", "someone-elses-momo")).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.momoAccount.findFirst).toHaveBeenCalledWith({
        where: { id: "someone-elses-momo", walletId: "w-1" },
      });
      expect(prisma.momoAccount.update).not.toHaveBeenCalled();
      expect(prisma.momoAccount.updateMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("should throw when the caller has no wallet", async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);
      await expect(service.setDefault("user-1", "bank", "b-1")).rejects.toThrow(NotFoundException);
      expect(prisma.bankAccount.update).not.toHaveBeenCalled();
    });
  });
});
