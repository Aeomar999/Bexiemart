import { NotFoundException } from "@nestjs/common";
import { BannerPlacement } from "@prisma/client";
import { mockPrisma } from "../../prisma/prisma.mock";
import { BannersService } from "./banners.service";

describe("BannersService", () => {
  let service: BannersService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new BannersService(prisma as any);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findActive", () => {
    it("queries active banners for the placement within the schedule window", async () => {
      prisma.banner.findMany.mockResolvedValue([{ id: "b1" }]);

      const result = await service.findActive(BannerPlacement.HOME);

      expect(result).toEqual([{ id: "b1" }]);
      const arg = prisma.banner.findMany.mock.calls[0][0];
      expect(arg.where.placement).toBe(BannerPlacement.HOME);
      expect(arg.where.isActive).toBe(true);
      expect(arg.where.AND).toHaveLength(2);
      expect(arg.orderBy).toEqual([{ sortOrder: "asc" }, { createdAt: "desc" }]);
    });
  });

  describe("list", () => {
    it("returns paginated banners with meta", async () => {
      prisma.banner.findMany.mockResolvedValue([{ id: "b1" }, { id: "b2" }]);
      prisma.banner.count.mockResolvedValue(2);

      const result = await service.list(1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({ total: 2, page: 1, limit: 20, totalPages: 1 });
      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 })
      );
    });

    it("filters by placement when provided", async () => {
      prisma.banner.findMany.mockResolvedValue([]);
      prisma.banner.count.mockResolvedValue(0);

      await service.list(2, 10, BannerPlacement.FOOD);

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { placement: BannerPlacement.FOOD }, skip: 10, take: 10 })
      );
    });
  });

  describe("create", () => {
    it("normalises date strings to Date objects", async () => {
      prisma.banner.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: "b1", ...data })
      );

      await service.create({
        placement: BannerPlacement.HOME,
        title: "Sale",
        imageUrl: "https://img/x.jpg",
        startsAt: "2026-07-01T00:00:00.000Z",
      } as any);

      const data = prisma.banner.create.mock.calls[0][0].data;
      expect(data.startsAt).toBeInstanceOf(Date);
      expect(data.title).toBe("Sale");
    });
  });

  describe("update", () => {
    it("throws when banner does not exist", async () => {
      prisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.update("missing", { title: "x" })).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(prisma.banner.update).not.toHaveBeenCalled();
    });

    it("updates an existing banner", async () => {
      prisma.banner.findUnique.mockResolvedValue({ id: "b1" });
      prisma.banner.update.mockResolvedValue({ id: "b1", title: "New" });

      const result = await service.update("b1", { title: "New" });

      expect(result).toEqual({ id: "b1", title: "New" });
      expect(prisma.banner.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "b1" } })
      );
    });
  });

  describe("remove", () => {
    it("throws when banner does not exist", async () => {
      prisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.remove("missing")).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.banner.delete).not.toHaveBeenCalled();
    });

    it("deletes an existing banner", async () => {
      prisma.banner.findUnique.mockResolvedValue({ id: "b1" });
      prisma.banner.delete.mockResolvedValue({ id: "b1" });

      const result = await service.remove("b1");

      expect(result).toEqual({ success: true });
      expect(prisma.banner.delete).toHaveBeenCalledWith({ where: { id: "b1" } });
    });
  });
});
