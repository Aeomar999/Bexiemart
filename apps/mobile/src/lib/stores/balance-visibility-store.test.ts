import AsyncStorage from "@react-native-async-storage/async-storage";
import { act } from "@testing-library/react-native";
import { useBalanceVisibility, BALANCE_VISIBILITY_KEY } from "./balance-visibility-store";

describe("balance-visibility-store", () => {
  beforeEach(() => {
    act(() => useBalanceVisibility.setState({ hidden: false }));
    jest.clearAllMocks();
  });

  it("defaults to visible", () => {
    expect(useBalanceVisibility.getState().hidden).toBe(false);
  });

  it("toggle flips hidden both ways", () => {
    act(() => useBalanceVisibility.getState().toggle());
    expect(useBalanceVisibility.getState().hidden).toBe(true);
    act(() => useBalanceVisibility.getState().toggle());
    expect(useBalanceVisibility.getState().hidden).toBe(false);
  });

  it("persists under the bexiemart-balance-visibility key", async () => {
    act(() => useBalanceVisibility.getState().toggle());
    await new Promise((r) => setTimeout(r, 0));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      BALANCE_VISIBILITY_KEY,
      expect.stringContaining('"hidden":true')
    );
  });
});
