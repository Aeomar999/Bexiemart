import { Test, TestingModule } from "@nestjs/testing";
import { PaymentMethodsController } from "./payment-methods.controller";
import { WalletService } from "./wallet.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("PaymentMethodsController", () => {
  let controller: PaymentMethodsController;
  let service: WalletService;

  const mockService = {
    getCards: jest.fn(),
    getMomoAccounts: jest.fn(),
    getBankAccounts: jest.fn(),
    addCard: jest.fn(),
    linkMomoAccount: jest.fn(),
    deleteCard: jest.fn(),
    deleteMomoAccount: jest.fn(),
    setDefaultCard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentMethodsController],
      providers: [
        { provide: WalletService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PaymentMethodsController>(PaymentMethodsController);
    service = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getAll", () => {
    it("should return unified payment methods", async () => {
      const cards = [
        { id: "card-1", type: "Visa", last4: "1234", cardholderName: "John", isDefault: true },
      ];
      const momoAccounts = [
        { id: "momo-1", provider: "MTN", phoneNumber: "+233501234567", accountName: "John", isDefault: false },
      ];
      const bankAccounts: any[] = [];

      mockService.getCards.mockResolvedValue(cards);
      mockService.getMomoAccounts.mockResolvedValue(momoAccounts);
      mockService.getBankAccounts.mockResolvedValue(bankAccounts);

      const req = { user: { id: "user-1" } };

      const result = await controller.getAll(req);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      expect(result.data[0]).toEqual({
        id: "card-1",
        type: "card",
        provider: "Visa",
        details: "**** **** **** 1234",
        holderName: "John",
        isDefault: true,
      });

      expect(result.data[1]).toEqual({
        id: "momo-1",
        type: "momo",
        provider: "MTN",
        details: "+233501234567",
        holderName: "John",
        isDefault: false,
      });

      expect(mockService.getCards).toHaveBeenCalledWith("user-1");
      expect(mockService.getMomoAccounts).toHaveBeenCalledWith("user-1");
      expect(mockService.getBankAccounts).toHaveBeenCalledWith("user-1");
    });

    it("should use fallback holderName when not provided on cards", async () => {
      const cards = [
        { id: "card-1", type: "Visa", last4: "1234", isDefault: false },
      ];
      const momoAccounts: any[] = [];
      const bankAccounts: any[] = [];

      mockService.getCards.mockResolvedValue(cards);
      mockService.getMomoAccounts.mockResolvedValue(momoAccounts);
      mockService.getBankAccounts.mockResolvedValue(bankAccounts);

      const req = { user: { id: "user-1" } };

      const result = await controller.getAll(req);

      expect(result.data[0].holderName).toBe("Cardholder");
    });
  });

  describe("addCard", () => {
    it("should call service.addCard and return success response", async () => {
      const newCard = { id: "card-1" };
      mockService.addCard.mockResolvedValue(newCard);
      const req = { user: { id: "user-1" } };
      const body = {
        provider: "Visa",
        holderName: "John Doe",
        details: "4111111111111234",
        expiry: "12/28",
        isDefault: true,
      };

      const result = await controller.addCard(req, body);

      expect(result).toEqual({ success: true, data: newCard });
      expect(mockService.addCard).toHaveBeenCalledWith("user-1", {
        type: "Visa",
        cardholderName: "John Doe",
        last4: "1234",
        expiryMonth: "12",
        expiryYear: "28",
        isDefault: true,
      });
    });
  });

  describe("addMomo", () => {
    it("should call service.linkMomoAccount and return success response", async () => {
      const newMomo = { id: "momo-1" };
      mockService.linkMomoAccount.mockResolvedValue(newMomo);
      const req = { user: { id: "user-1" } };
      const body = {
        provider: "mtn",
        holderName: "John Doe",
        details: "+233501234567",
        isDefault: true,
      };

      const result = await controller.addMomo(req, body);

      expect(result).toEqual({ success: true, data: newMomo });
      expect(mockService.linkMomoAccount).toHaveBeenCalledWith("user-1", {
        provider: "MTN",
        phoneNumber: "+233501234567",
        accountName: "John Doe",
        isDefault: true,
      });
    });
  });

  describe("remove", () => {
    it("should try deleteCard first and succeed", async () => {
      mockService.deleteCard.mockResolvedValue({ success: true });
      const req = { user: { id: "user-1" } };

      const result = await controller.remove(req, "card-1");

      expect(result).toEqual({ success: true });
      expect(mockService.deleteCard).toHaveBeenCalledWith("user-1", "card-1");
      expect(mockService.deleteMomoAccount).not.toHaveBeenCalled();
    });

    it("should fallback to deleteMomoAccount when deleteCard fails", async () => {
      mockService.deleteCard.mockRejectedValue(new Error("Not a card"));
      mockService.deleteMomoAccount.mockResolvedValue({ success: true });
      const req = { user: { id: "user-1" } };

      const result = await controller.remove(req, "momo-1");

      expect(result).toEqual({ success: true });
      expect(mockService.deleteCard).toHaveBeenCalledWith("user-1", "momo-1");
      expect(mockService.deleteMomoAccount).toHaveBeenCalledWith("user-1", "momo-1");
    });

    it("should throw BadRequestException when both fail", async () => {
      mockService.deleteCard.mockRejectedValue(new Error("Not found"));
      mockService.deleteMomoAccount.mockRejectedValue(new Error("Not found"));
      const req = { user: { id: "user-1" } };

      await expect(controller.remove(req, "unknown-id")).rejects.toThrow("Payment method not found");
    });
  });

  describe("setDefault", () => {
    it("should call service.setDefaultCard and return success", async () => {
      mockService.setDefaultCard.mockResolvedValue({ success: true });
      const req = { user: { id: "user-1" } };

      const result = await controller.setDefault(req, "card-1");

      expect(result).toEqual({ success: true });
      expect(mockService.setDefaultCard).toHaveBeenCalledWith("user-1", "card-1");
    });

    it("should throw BadRequestException when setDefaultCard fails", async () => {
      mockService.setDefaultCard.mockRejectedValue(new Error("Not found"));
      const req = { user: { id: "user-1" } };

      await expect(controller.setDefault(req, "unknown-id")).rejects.toThrow("Could not set default payment method");
    });
  });
});
