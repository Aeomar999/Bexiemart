import { Test, TestingModule } from "@nestjs/testing";
import { BannerPlacement } from "@prisma/client";
import { BannersController } from "./banners.controller";
import { AdminBannersController } from "./admin-banners.controller";
import { BannersService } from "./banners.service";
import { AuthGuard } from "../../guards/auth.guard";
import { AdminGuard } from "../../guards/admin.guard";

describe("Banners controllers", () => {
  let publicController: BannersController;
  let adminController: AdminBannersController;

  const mockService = {
    findActive: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BannersController, AdminBannersController],
      providers: [{ provide: BannersService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    publicController = module.get(BannersController);
    adminController = module.get(AdminBannersController);
  });

  afterEach(() => jest.clearAllMocks());

  it("should be defined", () => {
    expect(publicController).toBeDefined();
    expect(adminController).toBeDefined();
  });

  describe("public findActive", () => {
    it("delegates to service with placement", async () => {
      const result = [{ id: "b1" }];
      mockService.findActive.mockResolvedValue(result);

      expect(await publicController.findActive(BannerPlacement.HOME)).toEqual(result);
      expect(mockService.findActive).toHaveBeenCalledWith(BannerPlacement.HOME);
    });
  });

  describe("admin list", () => {
    it("coerces pagination query params to numbers", async () => {
      mockService.list.mockResolvedValue({ data: [], meta: {} });

      await adminController.list("2", "10", BannerPlacement.FOOD);

      expect(mockService.list).toHaveBeenCalledWith(2, 10, BannerPlacement.FOOD);
    });

    it("defaults pagination when params absent", async () => {
      mockService.list.mockResolvedValue({ data: [], meta: {} });

      await adminController.list();

      expect(mockService.list).toHaveBeenCalledWith(1, 20, undefined);
    });
  });

  describe("admin mutations", () => {
    it("creates a banner", async () => {
      const dto = { placement: BannerPlacement.HOME, title: "x", imageUrl: "u" } as any;
      mockService.create.mockResolvedValue({ id: "b1" });

      expect(await adminController.create(dto)).toEqual({ id: "b1" });
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it("updates a banner", async () => {
      mockService.update.mockResolvedValue({ id: "b1" });

      await adminController.update("b1", { title: "y" } as any);

      expect(mockService.update).toHaveBeenCalledWith("b1", { title: "y" });
    });

    it("removes a banner", async () => {
      mockService.remove.mockResolvedValue({ success: true });

      expect(await adminController.remove("b1")).toEqual({ success: true });
      expect(mockService.remove).toHaveBeenCalledWith("b1");
    });
  });
});
