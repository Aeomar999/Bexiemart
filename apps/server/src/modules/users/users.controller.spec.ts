import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("UsersController", () => {
  let controller: UsersController;
  let service: UsersService;

  const mockService = {
    getMe: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getCurrentUser", () => {
    it("should call service.getMe and return result", async () => {
      const result = { id: "user-1", name: "John" };
      mockService.getMe.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getCurrentUser(req)).toEqual(result);
      expect(mockService.getMe).toHaveBeenCalledWith("user-1");
    });
  });

  describe("updateProfile", () => {
    it("should call service.updateProfile and return result", async () => {
      const result = { id: "user-1", name: "John Updated" };
      const dto = { name: "John Updated" };
      mockService.updateProfile.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.updateProfile(req, dto)).toEqual(result);
      expect(mockService.updateProfile).toHaveBeenCalledWith("user-1", dto);
    });
  });
});
