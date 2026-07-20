import { Test, TestingModule } from "@nestjs/testing";
import { LoyaltyController } from "./loyalty.controller";
import { LoyaltyService } from "./loyalty.service";
import { AuthGuard } from "../../guards/auth.guard";
import { AuthenticatedRequest } from "../../types/request.types";

describe("LoyaltyController", () => {
  let controller: LoyaltyController;
  let service: LoyaltyService;

  const mockService = {
    getSummary: jest.fn(),
    convertCoinsToBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [{ provide: LoyaltyService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LoyaltyController>(LoyaltyController);
    service = module.get<LoyaltyService>(LoyaltyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getSummary calls loyaltyService.getSummary with user id", async () => {
    mockService.getSummary.mockResolvedValue({ balance: 500, ratePerCoin: 0.01 });
    const res = await controller.getSummary({ user: { id: "u1" } } as AuthenticatedRequest);
    expect(res).toEqual({ balance: 500, ratePerCoin: 0.01 });
    expect(mockService.getSummary).toHaveBeenCalledWith("u1");
  });

  it("convert calls loyaltyService.convertCoinsToBalance with user id and coins amount", async () => {
    mockService.convertCoinsToBalance.mockResolvedValue({ coinsBalance: 400, walletBalance: 11 });
    const res = await controller.convert({ user: { id: "u1" } } as AuthenticatedRequest, {
      coins: 100,
    });
    expect(res).toEqual({ coinsBalance: 400, walletBalance: 11 });
    expect(mockService.convertCoinsToBalance).toHaveBeenCalledWith("u1", 100);
  });
});
