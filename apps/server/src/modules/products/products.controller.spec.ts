import { Test, TestingModule } from "@nestjs/testing";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

describe("ProductsController", () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockService = {
    findAll: jest.fn(),
    getCategories: jest.fn(),
    getFeatured: jest.fn(),
    searchProducts: jest.fn(),
    findOne: jest.fn(),
    getStore: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll with dto", async () => {
      const result = [{ id: "p-1" }];
      mockService.findAll.mockResolvedValue(result);
      const dto = { category: "electronics" } as any;

      expect(await controller.findAll(dto)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith(dto);
    });
  });

  describe("getCategories", () => {
    it("should call service.getCategories", async () => {
      const result = ["Electronics", "Clothing"];
      mockService.getCategories.mockResolvedValue(result);

      expect(await controller.getCategories()).toEqual(result);
      expect(mockService.getCategories).toHaveBeenCalledWith();
    });
  });

  describe("getFeatured", () => {
    it("should call service.getFeatured", async () => {
      const result = [{ id: "p-1" }];
      mockService.getFeatured.mockResolvedValue(result);

      expect(await controller.getFeatured()).toEqual(result);
      expect(mockService.getFeatured).toHaveBeenCalledWith();
    });
  });

  describe("searchProducts", () => {
    it("should call service.searchProducts with query and limit", async () => {
      const result = [{ id: "p-1" }];
      mockService.searchProducts.mockResolvedValue(result);

      expect(await controller.searchProducts("phone", "10")).toEqual(result);
      expect(mockService.searchProducts).toHaveBeenCalledWith("phone", 10);
    });

    it("should return empty array when query is empty", async () => {
      expect(await controller.searchProducts("", "10")).toEqual([]);
      expect(mockService.searchProducts).not.toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should call service.findOne with id", async () => {
      const result = { id: "p-1" };
      mockService.findOne.mockResolvedValue(result);

      expect(await controller.findOne("id-1")).toEqual(result);
      expect(mockService.findOne).toHaveBeenCalledWith("id-1");
    });
  });

  describe("getStore", () => {
    it("should call service.getStore with id", async () => {
      const result = { id: "s-1", name: "Store" };
      mockService.getStore.mockResolvedValue(result);

      expect(await controller.getStore("id-1")).toEqual(result);
      expect(mockService.getStore).toHaveBeenCalledWith("id-1");
    });
  });
});
