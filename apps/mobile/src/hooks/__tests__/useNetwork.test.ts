import { renderHook, act } from "@testing-library/react-native";
import NetInfo from "@react-native-community/netinfo";
import { useNetwork } from "../useNetwork";

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(),
}));

describe("useNetwork", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with true", () => {
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(jest.fn());
    const { result } = renderHook(() => useNetwork());

    expect(result.current.isConnected).toBe(true);
  });

  it("should update connection state when network changes", () => {
    let listener: Function | null = null;

    (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
      listener = cb;
      return jest.fn(); // return unsubscribe function
    });

    const { result } = renderHook(() => useNetwork());

    // Initially true
    expect(result.current.isConnected).toBe(true);

    // Simulate network disconnect
    act(() => {
      if (listener) listener({ isConnected: false });
    });

    expect(result.current.isConnected).toBe(false);

    // Simulate network reconnect
    act(() => {
      if (listener) listener({ isConnected: true });
    });

    expect(result.current.isConnected).toBe(true);
  });

  it("should fall back to true if state.isConnected is null", () => {
    let listener: Function | null = null;

    (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
      listener = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useNetwork());

    act(() => {
      if (listener) listener({ isConnected: null });
    });

    expect(result.current.isConnected).toBe(true);
  });

  it("should unsubscribe on unmount", () => {
    const unsubscribeMock = jest.fn();
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useNetwork());

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
