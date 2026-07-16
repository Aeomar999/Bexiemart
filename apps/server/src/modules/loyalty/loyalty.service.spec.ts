import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { LoyaltyService } from "./loyalty.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("LoyaltyService.convert", () => {
  const walletRow = { id: "w1", userId: "u1", bexieCoins: 500, balance: 10 };
  const prisma = {
    wallet: {
      findUnique: jest.fn().mockResolvedValue(walletRow),
      update: jest.fn().mockResolvedValue({ ...walletRow, bexieCoins: 0, balance: 15 }),
    },
    $transaction: jest.fn(async (cb: any) => cb(prisma)),
    transaction: { create: jest.fn() },
  } as unknown as PrismaService;

  let service: LoyaltyService;
  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [LoyaltyService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = mod.get(LoyaltyService);
  });

  it("rejects converting more coins than the balance", async () => {
    await expect(service.convertCoinsToBalance("u1", 999)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("converts coins to cash at 100 coins = 1 GHS", async () => {
    const res = await service.convertCoinsToBalance("u1", 500);
    expect(res.walletBalance).toBe(15); // 10 + (500/100)
  });
});
