import { Test, TestingModule } from "@nestjs/testing";
import { CustomerServicesController } from "./customer-services.controller";
import { CustomerServicesService } from "./customer-services.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("CustomerServicesController", () => {
  let controller: CustomerServicesController;
  let service: CustomerServicesService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    book: jest.fn(),
    findMyBookings: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerServicesController],
      providers: [
        { provide: CustomerServicesService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CustomerServicesController>(CustomerServicesController);
    service = module.get<CustomerServicesService>(CustomerServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll with default pagination", async () => {
      const result = [{ id: "svc-1", name: "Service 1" }];
      mockService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith(undefined, undefined, 1, 20);
    });

    it("should call service.findAll with filters and pagination", async () => {
      const result = [{ id: "svc-1" }];
      mockService.findAll.mockResolvedValue(result);

      expect(await controller.findAll("cleaning", "clean", "1", "20")).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("cleaning", "clean", 1, 20);
    });
  });

  describe("findOne", () => {
    it("should call service.findOne and return result", async () => {
      const result = { id: "svc-1", name: "Service 1" };
      mockService.findOne.mockResolvedValue(result);

      expect(await controller.findOne("svc-1")).toEqual(result);
      expect(mockService.findOne).toHaveBeenCalledWith("svc-1");
    });
  });

  describe("book", () => {
    it("should call service.book and return result", async () => {
      const result = { bookingId: "book-1" };
      mockService.book.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const dto = { date: "2025-01-01" } as any;

      expect(await controller.book(req, "svc-1", dto)).toEqual(result);
      expect(mockService.book).toHaveBeenCalledWith("user-1", "svc-1", dto);
    });
  });

  describe("findMyBookings", () => {
    it("should call service.findMyBookings with default pagination", async () => {
      const result = [{ id: "book-1" }];
      mockService.findMyBookings.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findMyBookings(req)).toEqual(result);
      expect(mockService.findMyBookings).toHaveBeenCalledWith("user-1", 1, 20);
    });

    it("should call service.findMyBookings with custom pagination", async () => {
      const result = [{ id: "book-1" }];
      mockService.findMyBookings.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findMyBookings(req, "2", "10")).toEqual(result);
      expect(mockService.findMyBookings).toHaveBeenCalledWith("user-1", 2, 10);
    });
  });

  describe("cancel", () => {
    it("should call service.cancel and return result", async () => {
      const result = { success: true };
      mockService.cancel.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.cancel(req, "book-1")).toEqual(result);
      expect(mockService.cancel).toHaveBeenCalledWith("user-1", "book-1");
    });
  });
});
