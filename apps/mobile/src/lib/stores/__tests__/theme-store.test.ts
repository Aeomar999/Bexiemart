import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeStore, resolveScheme } from "../theme-store";

describe("resolveScheme", () => {
  it("returns the pinned scheme regardless of the OS", () => {
    expect(resolveScheme("light", "dark")).toBe("light");
    expect(resolveScheme("dark", "light")).toBe("dark");
  });

  it("follows the OS scheme when the preference is system", () => {
    expect(resolveScheme("system", "dark")).toBe("dark");
    expect(resolveScheme("system", "light")).toBe("light");
  });

  it("defaults to light when the OS scheme is null/undefined", () => {
    expect(resolveScheme("system", null)).toBe("light");
    expect(resolveScheme("system", undefined)).toBe("light");
  });
});

describe("useThemeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ preference: "system", hydrated: false });
    jest.clearAllMocks();
  });

  it("setPreference updates state and persists to AsyncStorage", () => {
    useThemeStore.getState().setPreference("dark");
    expect(useThemeStore.getState().preference).toBe("dark");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("bexiemart_theme_preference", "dark");
  });

  it("hydrate loads a saved valid preference", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("dark");
    await useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().preference).toBe("dark");
    expect(useThemeStore.getState().hydrated).toBe(true);
  });

  it("hydrate falls back to system for missing or invalid values", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().preference).toBe("system");
    expect(useThemeStore.getState().hydrated).toBe(true);

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("banana");
    await useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().preference).toBe("system");
  });
});
