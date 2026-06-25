import { Test, TestingModule } from "@nestjs/testing";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("PaymentsController", () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockService = {
    initialize: jest.fn(),
    verify: jest.fn(),
    handleWebhook: jest.fn(),
    chargeAuthorization: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("initialize", () => {
    it("should call service.initialize with user id and dto", async () => {
      const result = { authorizationUrl: "https://..." };
      mockService.initialize.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const dto = { amount: 5000, email: "test@test.com" } as any;

      expect(await controller.initialize(req, dto)).toEqual(result);
      expect(mockService.initialize).toHaveBeenCalledWith("user-1", dto);
    });
  });

  describe("verify", () => {
    it("should call service.verify with user id and reference", async () => {
      const result = { status: "success" };
      mockService.verify.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.verify(req, "ref-1")).toEqual(result);
      expect(mockService.verify).toHaveBeenCalledWith("user-1", "ref-1");
    });
  });

  describe("handleWebhook", () => {
    it("should verify signature against the raw body and call service.handleWebhook", async () => {
      const origSecret = process.env.PAYSTACK_SECRET_KEY;
      process.env.PAYSTACK_SECRET_KEY = "test-secret";

      const body = { event: "charge.success" };
      const rawBody = Buffer.from(JSON.stringify(body));
      const crypto = require("crypto");
      const signature = crypto.createHmac("sha512", "test-secret").update(rawBody).digest("hex");

      const result = { received: true };
      mockService.handleWebhook.mockResolvedValue(result);

      expect(await controller.handleWebhook({ rawBody }, signature, body)).toEqual(result);
      expect(mockService.handleWebhook).toHaveBeenCalledWith(body);

      process.env.PAYSTACK_SECRET_KEY = origSecret;
    });

    it("should reject an invalid signature", async () => {
      const origSecret = process.env.PAYSTACK_SECRET_KEY;
      process.env.PAYSTACK_SECRET_KEY = "test-secret";

      const body = { event: "charge.success" };
      const rawBody = Buffer.from(JSON.stringify(body));

      expect(() => controller.handleWebhook({ rawBody }, "deadbeef", body)).toThrow(
        "Invalid signature"
      );
      expect(mockService.handleWebhook).not.toHaveBeenCalled();

      process.env.PAYSTACK_SECRET_KEY = origSecret;
    });

    it("should reject when the raw body is missing", async () => {
      const origSecret = process.env.PAYSTACK_SECRET_KEY;
      process.env.PAYSTACK_SECRET_KEY = "test-secret";

      const body = { event: "charge.success" };
      const crypto = require("crypto");
      const signature = crypto
        .createHmac("sha512", "test-secret")
        .update(JSON.stringify(body))
        .digest("hex");

      expect(() => controller.handleWebhook({}, signature, body)).toThrow("Invalid signature");

      process.env.PAYSTACK_SECRET_KEY = origSecret;
    });
  });

  describe("chargeCard", () => {
    it("should call service.chargeAuthorization with user id and body fields", async () => {
      const result = { status: "charged" };
      mockService.chargeAuthorization.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { orderId: "ord-1", cardId: "card-1" };

      expect(await controller.chargeCard(req, body)).toEqual(result);
      expect(mockService.chargeAuthorization).toHaveBeenCalledWith("user-1", "ord-1", "card-1");
    });
  });
});
