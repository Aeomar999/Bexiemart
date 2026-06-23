import { mockPrisma } from "../../prisma/prisma.mock";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof mockPrisma>;
  let config: { get: jest.Mock };
  let logger: { info: jest.Mock; error: jest.Mock };
  let delivery: { createJobForOrder: jest.Mock };

  beforeEach(() => {
    prisma = mockPrisma();
    config = { get: jest.fn().mockReturnValue("paystack_secret") };
    logger = { info: jest.fn(), error: jest.fn() };
    delivery = { createJobForOrder: jest.fn() };
    service = new PaymentsService(prisma as any, config as any, delivery as any, logger as any);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should initialize payment and return authorization url", async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: "o1",
      paymentStatus: "pending",
      total: 100,
    } as any);
    prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "test@test.com" } as any);
    jest.spyOn(service as any, "paystackPost").mockResolvedValue({
      status: true,
      data: { authorization_url: "https://paystack.com/authorize", reference: "ref-1" },
    });
    const result = await service.initialize("u1", { orderId: "o1", callbackUrl: undefined } as any);
    expect(result.authorizationUrl).toBe("https://paystack.com/authorize");
    expect(result.reference).toBe("ref-1");
  });

  it("should verify payment", async () => {
    jest.spyOn(service as any, "paystackGet").mockResolvedValue({
      status: true,
      data: {
        status: "success",
        reference: "ref-1",
        channel: "card",
        amount: 10000,
        currency: "GHS",
      },
    });
    prisma.order.findFirst.mockResolvedValue({
      id: "o1",
      paystackRef: "ref-1",
      userId: "u1",
    } as any);
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
    prisma.order.update.mockResolvedValue({} as any);
    prisma.payment.upsert.mockResolvedValue({} as any);
    const result = await service.verify("u1", "ref-1");
    expect(result.status).toBe("success");
  });

  it("should handle webhook", async () => {
    prisma.transaction.findUnique.mockResolvedValue(null);
    const result = await service.handleWebhook({
      event: "charge.success",
      data: { reference: "ref-1" },
    });
    expect(result).toEqual({ received: true });
  });
});
