import { Test, TestingModule } from "@nestjs/testing";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("WalletController", () => {
  let controller: WalletController;
  let service: WalletService;

  const mockService = {
    getWallet: jest.fn(),
    getTransactions: jest.fn(),
    initializeTopUp: jest.fn(),
    verifyTopUp: jest.fn(),
    withdraw: jest.fn(),
    transfer: jest.fn(),
    setPin: jest.fn(),
    changePin: jest.fn(),
    verifyPin: jest.fn(),
    resetPinFailures: jest.fn(),
    getPinStatus: jest.fn(),
    getCards: jest.fn(),
    addCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
    setDefaultCard: jest.fn(),
    getBankAccounts: jest.fn(),
    linkBankAccount: jest.fn(),
    deleteBankAccount: jest.fn(),
    resolveBankAccount: jest.fn(),
    getMomoAccounts: jest.fn(),
    linkMomoAccount: jest.fn(),
    deleteMomoAccount: jest.fn(),
    verifyAndSaveCard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<WalletController>(WalletController);
    service = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getWallet", () => {
    it("should call service.getWallet with user id", async () => {
      const result = { balance: 1000 };
      mockService.getWallet.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getWallet(req)).toEqual(result);
      expect(mockService.getWallet).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getTransactions", () => {
    it("should call service.getTransactions with default page", async () => {
      const result = { data: [], total: 0 };
      mockService.getTransactions.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getTransactions(req)).toEqual(result);
      expect(mockService.getTransactions).toHaveBeenCalledWith("user-1", 1);
    });

    it("should call service.getTransactions with specific page", async () => {
      const result = { data: [], total: 0 };
      mockService.getTransactions.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getTransactions(req, "2")).toEqual(result);
      expect(mockService.getTransactions).toHaveBeenCalledWith("user-1", 2);
    });
  });

  describe("initializeTopUp", () => {
    it("should call service.initializeTopUp with default channel", async () => {
      const result = { reference: "ref-1" };
      mockService.initializeTopUp.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { amount: 5000, channel: "MOMO" };

      expect(await controller.initializeTopUp(req, body)).toEqual(result);
      expect(mockService.initializeTopUp).toHaveBeenCalledWith("user-1", 5000, "MOMO");
    });

    it("should call service.initializeTopUp with specified channel", async () => {
      const result = { reference: "ref-1" };
      mockService.initializeTopUp.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { amount: 5000, channel: "CARD" };

      expect(await controller.initializeTopUp(req, body)).toEqual(result);
      expect(mockService.initializeTopUp).toHaveBeenCalledWith("user-1", 5000, "CARD");
    });
  });

  describe("verifyTopUp", () => {
    it("should call service.verifyTopUp with user id and reference", async () => {
      const result = { status: "success" };
      mockService.verifyTopUp.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.verifyTopUp(req, "ref-1")).toEqual(result);
      expect(mockService.verifyTopUp).toHaveBeenCalledWith("user-1", "ref-1");
    });
  });

  describe("withdraw", () => {
    it("should call service.withdraw with all params", async () => {
      const result = { success: true };
      mockService.withdraw.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { amount: 2000, accountId: "acc-1", accountType: "bank" as const, pin: "1234" };

      expect(await controller.withdraw(req, body)).toEqual(result);
      expect(mockService.withdraw).toHaveBeenCalledWith("user-1", 2000, "acc-1", "bank", "1234");
    });
  });

  describe("transfer", () => {
    it("should call service.transfer with all params", async () => {
      const result = { success: true };
      mockService.transfer.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { recipientEmail: "user2@test.com", amount: 1000, pin: "1234" };

      expect(await controller.transfer(req, body)).toEqual(result);
      expect(mockService.transfer).toHaveBeenCalledWith("user-1", "user2@test.com", 1000, "1234");
    });
  });

  describe("setPin", () => {
    it("should call service.setPin with user id and pin", async () => {
      const result = { success: true };
      mockService.setPin.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { pin: "1234" };

      expect(await controller.setPin(req, body)).toEqual(result);
      expect(mockService.setPin).toHaveBeenCalledWith("user-1", "1234");
    });
  });

  describe("changePin", () => {
    it("should call service.changePin with current pin and new pin", async () => {
      const result = { success: true };
      mockService.changePin.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { currentPin: "1234", newPin: "5678" };

      expect(await controller.changePin(req, body)).toEqual(result);
      expect(mockService.changePin).toHaveBeenCalledWith("user-1", "1234", "5678");
    });
  });

  describe("verifyPin", () => {
    it("should call service.verifyPin with user id and pin", async () => {
      const result = { valid: true };
      mockService.verifyPin.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { pin: "1234" };

      expect(await controller.verifyPin(req, body)).toEqual(result);
      expect(mockService.verifyPin).toHaveBeenCalledWith("user-1", "1234");
    });
  });

  describe("resetPinFailures", () => {
    it("should call service.resetPinFailures with user id", async () => {
      const result = { success: true };
      mockService.resetPinFailures.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.resetPinFailures(req)).toEqual(result);
      expect(mockService.resetPinFailures).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getPinStatus", () => {
    it("should call service.getPinStatus with user id", async () => {
      const result = { hasPin: true };
      mockService.getPinStatus.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getPinStatus(req)).toEqual(result);
      expect(mockService.getPinStatus).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getCards", () => {
    it("should call service.getCards with user id", async () => {
      const result = [{ id: "card-1", last4: "1234" }];
      mockService.getCards.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getCards(req)).toEqual(result);
      expect(mockService.getCards).toHaveBeenCalledWith("user-1");
    });
  });

  describe("addCard", () => {
    it("should call service.addCard with user id and body", async () => {
      const result = { id: "card-1" };
      mockService.addCard.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { type: "Visa", cardholderName: "John Doe", last4: "1234", expiryMonth: "12", expiryYear: "28" };

      expect(await controller.addCard(req, body)).toEqual(result);
      expect(mockService.addCard).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("updateCard", () => {
    it("should call service.updateCard with user id, card id, and body", async () => {
      const result = { id: "card-1" };
      mockService.updateCard.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { isDefault: true };

      expect(await controller.updateCard(req, "card-1", body)).toEqual(result);
      expect(mockService.updateCard).toHaveBeenCalledWith("user-1", "card-1", body);
    });
  });

  describe("deleteCard", () => {
    it("should call service.deleteCard with user id and card id", async () => {
      mockService.deleteCard.mockResolvedValue({ success: true });
      const req = { user: { id: "user-1" } };

      expect(await controller.deleteCard(req, "card-1")).toEqual({ success: true });
      expect(mockService.deleteCard).toHaveBeenCalledWith("user-1", "card-1");
    });
  });

  describe("setDefaultCard", () => {
    it("should call service.setDefaultCard with user id and card id", async () => {
      mockService.setDefaultCard.mockResolvedValue({ success: true });
      const req = { user: { id: "user-1" } };

      expect(await controller.setDefaultCard(req, "card-1")).toEqual({ success: true });
      expect(mockService.setDefaultCard).toHaveBeenCalledWith("user-1", "card-1");
    });
  });

  describe("getBankAccounts", () => {
    it("should call service.getBankAccounts with user id", async () => {
      const result = [{ id: "bank-1", accountNumber: "1234567890" }];
      mockService.getBankAccounts.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getBankAccounts(req)).toEqual(result);
      expect(mockService.getBankAccounts).toHaveBeenCalledWith("user-1");
    });
  });

  describe("linkBankAccount", () => {
    it("should call service.linkBankAccount with user id and body", async () => {
      const result = { id: "bank-1" };
      mockService.linkBankAccount.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { bankCode: "044", accountNumber: "1234567890", accountName: "John Doe" };

      expect(await controller.linkBankAccount(req, body)).toEqual(result);
      expect(mockService.linkBankAccount).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("deleteBankAccount", () => {
    it("should call service.deleteBankAccount with user id and account id", async () => {
      mockService.deleteBankAccount.mockResolvedValue({ success: true });
      const req = { user: { id: "user-1" } };

      expect(await controller.deleteBankAccount(req, "bank-1")).toEqual({ success: true });
      expect(mockService.deleteBankAccount).toHaveBeenCalledWith("user-1", "bank-1");
    });
  });

  describe("resolveAccount", () => {
    it("should call service.resolveBankAccount with bank code and account number", async () => {
      const result = { accountName: "John Doe" };
      mockService.resolveBankAccount.mockResolvedValue(result);
      const query = { bankCode: "044", accountNumber: "1234567890" };

      expect(await controller.resolveAccount(query)).toEqual(result);
      expect(mockService.resolveBankAccount).toHaveBeenCalledWith("044", "1234567890");
    });
  });

  describe("getMomoAccounts", () => {
    it("should call service.getMomoAccounts with user id", async () => {
      const result = [{ id: "momo-1", phoneNumber: "+233501234567" }];
      mockService.getMomoAccounts.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getMomoAccounts(req)).toEqual(result);
      expect(mockService.getMomoAccounts).toHaveBeenCalledWith("user-1");
    });
  });

  describe("linkMomoAccount", () => {
    it("should call service.linkMomoAccount with user id and body", async () => {
      const result = { id: "momo-1" };
      mockService.linkMomoAccount.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { provider: "MTN" as any, phoneNumber: "+233501234567", accountName: "John Doe" };

      expect(await controller.linkMomoAccount(req, body)).toEqual(result);
      expect(mockService.linkMomoAccount).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("deleteMomoAccount", () => {
    it("should call service.deleteMomoAccount with user id and momo id", async () => {
      mockService.deleteMomoAccount.mockResolvedValue({ success: true });
      const req = { user: { id: "user-1" } };

      expect(await controller.deleteMomoAccount(req, "momo-1")).toEqual({ success: true });
      expect(mockService.deleteMomoAccount).toHaveBeenCalledWith("user-1", "momo-1");
    });
  });

  describe("verifyAndSaveCard", () => {
    it("should call service.verifyAndSaveCard with all params", async () => {
      const result = { id: "card-1" };
      mockService.verifyAndSaveCard.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { reference: "ref-1", cardholderName: "John Doe", isDefault: true };

      expect(await controller.verifyAndSaveCard(req, body)).toEqual(result);
      expect(mockService.verifyAndSaveCard).toHaveBeenCalledWith("user-1", "ref-1", "John Doe", true);
    });
  });
});
