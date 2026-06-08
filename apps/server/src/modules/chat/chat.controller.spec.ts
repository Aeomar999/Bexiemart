import { Test, TestingModule } from "@nestjs/testing";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { AuthGuard } from "../../guards/auth.guard";

describe("ChatController", () => {
  let controller: ChatController;
  let service: ChatService;
  let gateway: ChatGateway;

  const mockService = {
    getConversations: jest.fn(),
    getConversation: jest.fn(),
    createConversation: jest.fn(),
    markAsRead: jest.fn(),
    getMessages: jest.fn(),
  };

  const mockChatGateway = {
    isUserOnline: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: mockService },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
    gateway = module.get<ChatGateway>(ChatGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getPresence", () => {
    it("should return empty object when no userIds provided", () => {
      expect(controller.getPresence("")).toEqual({});
      expect(mockChatGateway.isUserOnline).not.toHaveBeenCalled();
    });

    it("should return presence map for comma-separated ids", () => {
      mockChatGateway.isUserOnline.mockReturnValueOnce(true);
      mockChatGateway.isUserOnline.mockReturnValueOnce(false);

      const result = controller.getPresence("user-1,user-2");

      expect(result).toEqual({ "user-1": true, "user-2": false });
      expect(mockChatGateway.isUserOnline).toHaveBeenCalledTimes(2);
      expect(mockChatGateway.isUserOnline).toHaveBeenCalledWith("user-1");
      expect(mockChatGateway.isUserOnline).toHaveBeenCalledWith("user-2");
    });
  });

  describe("getConversations", () => {
    it("should call service.getConversations with user id", async () => {
      const result = [{ id: "conv-1" }];
      mockService.getConversations.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getConversations(req)).toEqual(result);
      expect(mockService.getConversations).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getConversation", () => {
    it("should call service.getConversation with conversation id and user id", async () => {
      const result = { id: "conv-1" };
      mockService.getConversation.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getConversation(req, "conv-1")).toEqual(result);
      expect(mockService.getConversation).toHaveBeenCalledWith("conv-1", "user-1");
    });
  });

  describe("createConversation", () => {
    it("should call service.createConversation with user id, participant id, and order id", async () => {
      const result = { id: "conv-1" };
      mockService.createConversation.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { participantId: "user-2", orderId: "order-1" };

      expect(await controller.createConversation(req, body)).toEqual(result);
      expect(mockService.createConversation).toHaveBeenCalledWith("user-1", "user-2", "order-1");
    });
  });

  describe("markAsRead", () => {
    it("should call service.markAsRead with conversation id and user id", async () => {
      mockService.markAsRead.mockResolvedValue({ success: true });
      const req = { user: { id: "user-1" } };

      expect(await controller.markAsRead(req, "conv-1")).toEqual({ success: true });
      expect(mockService.markAsRead).toHaveBeenCalledWith("conv-1", "user-1");
    });
  });

  describe("getMessages", () => {
    it("should call service.getMessages with all params", async () => {
      const result = { data: [], total: 0 };
      mockService.getMessages.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getMessages(req, "conv-1", 1, 20)).toEqual(result);
      expect(mockService.getMessages).toHaveBeenCalledWith("conv-1", "user-1", 1, 20);
    });

    it("should call service.getMessages with undefined pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.getMessages.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getMessages(req, "conv-1")).toEqual(result);
      expect(mockService.getMessages).toHaveBeenCalledWith("conv-1", "user-1", undefined, undefined);
    });
  });
});
