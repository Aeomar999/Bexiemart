import { Test, TestingModule } from "@nestjs/testing";
import { CollectionsController } from "./collections.controller";
import { CollectionsService } from "./collections.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("CollectionsController", () => {
  let controller: CollectionsController;
  let service: CollectionsService;

  const mockService = {
    getUserCollections: jest.fn(),
    getCollection: jest.fn(),
    createCollection: jest.fn(),
    deleteCollection: jest.fn(),
    addItemToCollection: jest.fn(),
    removeItemFromCollection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionsController],
      providers: [
        { provide: CollectionsService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CollectionsController>(CollectionsController);
    service = module.get<CollectionsService>(CollectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getUserCollections", () => {
    it("should call service.getUserCollections and return result", async () => {
      const result = [{ id: "col-1", name: "Favorites" }];
      mockService.getUserCollections.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getUserCollections(req)).toEqual(result);
      expect(mockService.getUserCollections).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getCollection", () => {
    it("should call service.getCollection and return result", async () => {
      const result = { id: "col-1", name: "Favorites" };
      mockService.getCollection.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getCollection(req, "col-1")).toEqual(result);
      expect(mockService.getCollection).toHaveBeenCalledWith("user-1", "col-1");
    });
  });

  describe("createCollection", () => {
    it("should call service.createCollection and return result", async () => {
      const result = { id: "col-1", name: "New Collection" };
      mockService.createCollection.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const dto = { name: "New Collection", description: "A test collection" };

      expect(await controller.createCollection(req, dto)).toEqual(result);
      expect(mockService.createCollection).toHaveBeenCalledWith("user-1", "New Collection", "A test collection");
    });
  });

  describe("deleteCollection", () => {
    it("should call service.deleteCollection and return result", async () => {
      const result = { success: true };
      mockService.deleteCollection.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.deleteCollection(req, "col-1")).toEqual(result);
      expect(mockService.deleteCollection).toHaveBeenCalledWith("user-1", "col-1");
    });
  });

  describe("addItemToCollection", () => {
    it("should call service.addItemToCollection and return result", async () => {
      const result = { success: true };
      mockService.addItemToCollection.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const dto = { productId: "prod-1" };

      expect(await controller.addItemToCollection(req, "col-1", dto)).toEqual(result);
      expect(mockService.addItemToCollection).toHaveBeenCalledWith("user-1", "col-1", "prod-1");
    });
  });

  describe("removeItemFromCollection", () => {
    it("should call service.removeItemFromCollection and return result", async () => {
      const result = { success: true };
      mockService.removeItemFromCollection.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.removeItemFromCollection(req, "col-1", "prod-1")).toEqual(result);
      expect(mockService.removeItemFromCollection).toHaveBeenCalledWith("user-1", "col-1", "prod-1");
    });
  });
});
