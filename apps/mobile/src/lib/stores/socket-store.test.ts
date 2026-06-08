jest.mock("../socket", () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
  },
}));

import { useSocketStore } from "./socket-store";
import { socketService } from "../socket";

const makeSocket = () => ({
  on: jest.fn(),
  emit: jest.fn(),
  connected: true,
});

describe("Socket Store", () => {
  beforeEach(() => {
    useSocketStore.setState({ isConnected: false, onlineUsers: {}, offlineMessages: [] });
    jest.clearAllMocks();
  });

  it("should connect and register event listeners", () => {
    const socket = makeSocket();
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.getState().connect();
    expect(socketService.connect).toHaveBeenCalled();
    expect(socket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("presence_update", expect.any(Function));
  });

  it("should set connected on socket connect event", () => {
    const socket = makeSocket();
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.getState().connect();
    const connectHandler = socket.on.mock.calls.find((c: any[]) => c[0] === "connect")[1];
    connectHandler();
    expect(useSocketStore.getState().isConnected).toBe(true);
  });

  it("should set disconnected on socket disconnect event", () => {
    const socket = makeSocket();
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.getState().connect();
    const disconnectHandler = socket.on.mock.calls.find((c: any[]) => c[0] === "disconnect")[1];
    useSocketStore.setState({ isConnected: true });
    disconnectHandler();
    expect(useSocketStore.getState().isConnected).toBe(false);
  });

  it("should update online users on presence update", () => {
    const socket = makeSocket();
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.getState().connect();
    const presenceHandler = socket.on.mock.calls.find((c: any[]) => c[0] === "presence_update")[1];
    presenceHandler({ userId: "u1", isOnline: true });
    expect(useSocketStore.getState().onlineUsers).toEqual({ u1: true });
  });

  it("should disconnect and clear state", () => {
    useSocketStore.getState().disconnect();
    expect(socketService.disconnect).toHaveBeenCalled();
    expect(useSocketStore.getState().isConnected).toBe(false);
    expect(useSocketStore.getState().onlineUsers).toEqual({});
  });

  it("should subscribe presence when connected", () => {
    const socket = makeSocket();
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.getState().subscribePresence(["u1", "u2"]);
    expect(socket.emit).toHaveBeenCalledWith("subscribe_presence", { userIds: ["u1", "u2"] });
  });

  it("should not subscribe presence when not connected", () => {
    const socket = { ...makeSocket(), connected: false };
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.getState().subscribePresence(["u1"]);
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it("should unsubscribe presence", () => {
    const socket = makeSocket();
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.getState().unsubscribePresence(["u1"]);
    expect(socket.emit).toHaveBeenCalledWith("unsubscribe_presence", { userIds: ["u1"] });
  });

  it("should enqueue offline message and flush if connected", () => {
    const socket = makeSocket();
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.setState({ isConnected: true });
    useSocketStore.getState().enqueueMessage({ text: "Hello" });
    expect(socket.emit).toHaveBeenCalledWith("send_message", { text: "Hello" });
    expect(useSocketStore.getState().offlineMessages).toHaveLength(0);
  });

  it("should queue offline message when disconnected", () => {
    const socket = makeSocket();
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.setState({ isConnected: false });
    useSocketStore.getState().enqueueMessage({ text: "Hello" });
    expect(useSocketStore.getState().offlineMessages).toHaveLength(1);
  });

  it("should flush offline messages when reconnected", () => {
    const socket = makeSocket();
    (socketService.get as jest.Mock).mockReturnValue(socket);
    useSocketStore.setState({ offlineMessages: [{ text: "Msg1" }, { text: "Msg2" }] });
    useSocketStore.getState().flushOfflineMessages();
    expect(socket.emit).toHaveBeenCalledTimes(2);
    expect(useSocketStore.getState().offlineMessages).toHaveLength(0);
  });
});
