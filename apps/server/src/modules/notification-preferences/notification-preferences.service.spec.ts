import { Test } from "@nestjs/testing";
import { NotificationPreferencesService } from "./notification-preferences.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("NotificationPreferencesService", () => {
  const defaults = {
    id: "np1",
    userId: "u1",
    newOrder: true,
    orderCancel: true,
    payout: true,
    chat: true,
    promo: false,
    email: true,
    sms: false,
  };

  const prisma = {
    notificationPreference: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue(defaults),
      update: jest.fn().mockResolvedValue({ ...defaults, promo: true }),
    },
  } as unknown as PrismaService;

  let service: NotificationPreferencesService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [NotificationPreferencesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = mod.get(NotificationPreferencesService);
  });

  it("auto-creates defaults if none exist when get is called", async () => {
    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await service.get("u1");
    expect(prisma.notificationPreference.create).toHaveBeenCalledWith({ data: { userId: "u1" } });
    expect(res).toEqual(defaults);
  });

  it("updates partial booleans using update", async () => {
    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(defaults);
    const res = await service.update("u1", { promo: true });
    expect(prisma.notificationPreference.update).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: { promo: true },
    });
    expect(res.promo).toBe(true);
  });
});
