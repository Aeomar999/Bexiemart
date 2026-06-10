import { socketService } from "../socket";
import { io } from "socket.io-client";
import { useAuthStore } from "../stores/auth-store";

jest.mock("socket.io-client", () => {
  const mSocket = {
    on: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  };
  return {
    io: jest.fn(() => mSocket),
  };
});

jest.mock("../../config", () => ({
  ENV: {
    SOCKET_URL: "http://localhost:3000",
  },
}));

jest.mock("../stores/auth-store", () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

describe("socketService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    socketService.socket = null;
  });

  it("should not connect if there is no token", () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ token: null });

    socketService.connect();

    expect(io).not.toHaveBeenCalled();
    expect(socketService.get()).toBeNull();
  });

  it("should connect if there is a token and not already connected", () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ token: "test-token" });

    socketService.connect();

    expect(io).toHaveBeenCalledWith("http://localhost:3000", {
      auth: { token: "test-token" },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const socket = socketService.get();
    expect(socket).not.toBeNull();
    expect(socket?.on).toHaveBeenCalledWith("connect_error", expect.any(Function));
  });

  it("should not connect if already connected", () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ token: "test-token" });

    socketService.connect();
    const mockSocket = socketService.get() as any;

    jest.clearAllMocks();

    if (mockSocket) {
      mockSocket.connected = true;
    }

    socketService.connect();

    expect(io).not.toHaveBeenCalled();
  });

  it("should disconnect if socket exists", () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ token: "test-token" });
    socketService.connect();

    const mockSocket = socketService.get();
    expect(mockSocket).not.toBeNull();

    socketService.disconnect();

    expect(mockSocket?.disconnect).toHaveBeenCalled();
    expect(socketService.get()).toBeNull();
  });

  it("should handle disconnect gracefully when no socket exists", () => {
    socketService.disconnect();
    expect(socketService.get()).toBeNull();
  });
});
