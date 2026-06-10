import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe("UsersService", () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getMe", () => {
    it("should retrieve a user profile", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe("1");

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        select: expect.any(Object),
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe("1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateProfile", () => {
    it("should update a user profile", async () => {
      const mockUser = { id: "1", name: "Test User" };
      const dto = { name: "Updated Name" };
      const updatedUser = { ...mockUser, ...dto };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile("1", dto);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: dto,
        select: expect.any(Object),
      });
    });

    it("should mutate the user role if included in DTO", async () => {
      const mockUser = { id: "1", role: "USER" };
      const dto = { role: "VENDOR" } as any;
      const updatedUser = { ...mockUser, ...dto };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile("1", dto);
      expect((result as any).role).toBe("VENDOR");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: dto,
        select: expect.any(Object),
      });
    });

    it("should throw NotFoundException if user to update is not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile("1", { name: "New Name" })).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
