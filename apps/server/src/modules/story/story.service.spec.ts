import { Test, TestingModule } from "@nestjs/testing";
import { StoryService } from "./story.service";
import { PrismaService } from "../../prisma/prisma.service";

const mockPrisma = {
  story: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  storyView: { create: jest.fn() },
  vendorProfile: { findUnique: jest.fn() },
};

describe("StoryService", () => {
  let service: StoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoryService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<StoryService>(StoryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
