import { Test, TestingModule } from "@nestjs/testing";
import { StoryController } from "./story.controller";
import { StoryService } from "./story.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("StoryController", () => {
  let controller: StoryController;
  let service: StoryService;

  const mockService = {
    getActiveStories: jest.fn(),
    createStory: jest.fn(),
    deleteStory: jest.fn(),
    recordView: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoryController],
      providers: [
        { provide: StoryService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<StoryController>(StoryController);
    service = module.get<StoryService>(StoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getActiveStories", () => {
    it("should call service.getActiveStories with vendorId and return result", async () => {
      const result = [{ id: "story-1" }];
      mockService.getActiveStories.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getActiveStories(req, "vendor-1")).toEqual(result);
      expect(mockService.getActiveStories).toHaveBeenCalledWith("user-1", "vendor-1");
    });

    it("should call service.getActiveStories without vendorId", async () => {
      const result = [{ id: "story-1" }];
      mockService.getActiveStories.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getActiveStories(req, undefined)).toEqual(result);
      expect(mockService.getActiveStories).toHaveBeenCalledWith("user-1", undefined);
    });
  });

  describe("createStory", () => {
    it("should call service.createStory and return result", async () => {
      const result = { id: "story-1" };
      const body = { imageUrl: "https://...", caption: "New story" } as any;
      mockService.createStory.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.createStory(req, body)).toEqual(result);
      expect(mockService.createStory).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("deleteStory", () => {
    it("should call service.deleteStory and return result", async () => {
      const result = { deleted: true };
      mockService.deleteStory.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.deleteStory(req, "story-1")).toEqual(result);
      expect(mockService.deleteStory).toHaveBeenCalledWith("user-1", "story-1");
    });
  });

  describe("recordView", () => {
    it("should call service.recordView and return result", async () => {
      const result = { viewed: true };
      mockService.recordView.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.recordView(req, "story-1")).toEqual(result);
      expect(mockService.recordView).toHaveBeenCalledWith("user-1", "story-1");
    });
  });
});
