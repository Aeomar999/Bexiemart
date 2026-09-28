import { Linking } from "react-native";
import {
  buildDirectionsUrl,
  getNavigationAppLabel,
  getNavigationApps,
  openDirections,
} from "../navigation-apps";

const KNUST = { latitude: 6.6731, longitude: -1.5654 };

describe("navigation-apps", () => {
  it("offers Apple Maps only on iOS", () => {
    expect(getNavigationApps("ios").map((a) => a.id)).toEqual(["google", "waze", "apple"]);
    expect(getNavigationApps("android").map((a) => a.id)).toEqual(["google", "waze"]);
  });

  it("labels each app", () => {
    expect(getNavigationAppLabel("google")).toBe("Google Maps");
    expect(getNavigationAppLabel("waze")).toBe("Waze");
    expect(getNavigationAppLabel("apple")).toBe("Apple Maps");
  });

  it.each([
    ["google", "https://www.google.com/maps/dir/?api=1&destination=6.6731,-1.5654"],
    ["waze", "https://waze.com/ul?ll=6.6731,-1.5654&navigate=yes"],
    ["apple", "https://maps.apple.com/?daddr=6.6731,-1.5654"],
  ] as const)("builds a %s directions link to the destination", (app, url) => {
    expect(buildDirectionsUrl(app, KNUST)).toBe(url);
  });

  it("opens the chosen app's link", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await openDirections("waze", KNUST);
    expect(openURL).toHaveBeenCalledWith("https://waze.com/ul?ll=6.6731,-1.5654&navigate=yes");
    openURL.mockRestore();
  });
});
