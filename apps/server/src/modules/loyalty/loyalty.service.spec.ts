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
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
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
    (prisma.wallet.updateMany as jest.Mock).mockClear();
    (prisma.wallet.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
  });

  it("rejects converting more coins than the balance", async () => {
    // Guarded decrement claims zero rows when coins are insufficient.
    // (600 is a valid multiple but exceeds the 500-coin balance.)
    (prisma.wallet.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    await expect(service.convertCoinsToBalance("u1", 600)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prisma.wallet.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "w1", bexieCoins: { gte: 600 } }),
      })
    );
  });

  it("converts coins to cash at 100 coins = 1 GHS", async () => {
    const res = await service.convertCoinsToBalance("u1", 500);
    expect(res.walletBalance).toBe(15); // 10 + (500/100)
    expect(prisma.wallet.updateMany).toHaveBeenCalledWith({
      where: { id: "w1", bexieCoins: { gte: 500 } },
      data: { bexieCoins: { decrement: 500 } },
    });
  });
});
