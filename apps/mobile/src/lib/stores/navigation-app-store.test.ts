import AsyncStorage from "@react-native-async-storage/async-storage";
import { act } from "@testing-library/react-native";
import { useNavigationApp, NAVIGATION_APP_KEY } from "./navigation-app-store";

describe("navigation-app-store", () => {
  beforeEach(() => {
    act(() => {
      useNavigationApp.setState({ app: "google" });
    });
    jest.clearAllMocks();
  });

  it("defaults to Google Maps", () => {
    expect(useNavigationApp.getState().app).toBe("google");
  });

  it("setApp changes the preference", () => {
    act(() => {
      useNavigationApp.getState().setApp("waze");
    });
    expect(useNavigationApp.getState().app).toBe("waze");
  });

  it("persists under the bexiemart-navigation-app key", async () => {
    act(() => {
      useNavigationApp.getState().setApp("apple");
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      NAVIGATION_APP_KEY,
      expect.stringContaining('"app":"apple"')
    );
  });
});
