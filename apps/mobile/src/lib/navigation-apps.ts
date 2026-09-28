import { Linking, Platform } from "react-native";

export type NavigationAppId = "google" | "waze" | "apple";

export interface NavigationApp {
  id: NavigationAppId;
  label: string;
}

const ALL_APPS: NavigationApp[] = [
  { id: "google", label: "Google Maps" },
  { id: "waze", label: "Waze" },
  { id: "apple", label: "Apple Maps" },
];

// Apple Maps only ships on iOS.
export function getNavigationApps(os: string = Platform.OS): NavigationApp[] {
  return ALL_APPS.filter((app) => app.id !== "apple" || os === "ios");
}

export function getNavigationAppLabel(id: NavigationAppId): string {
  return ALL_APPS.find((app) => app.id === id)?.label ?? "Google Maps";
}

export interface Destination {
  latitude: number;
  longitude: number;
}

// Universal https links open the native app when it's installed and fall back
// to the web otherwise, so no canOpenURL / LSApplicationQueriesSchemes setup.
export function buildDirectionsUrl(app: NavigationAppId, { latitude, longitude }: Destination) {
  const ll = `${latitude},${longitude}`;
  switch (app) {
    case "waze":
      return `https://waze.com/ul?ll=${ll}&navigate=yes`;
    case "apple":
      return `https://maps.apple.com/?daddr=${ll}`;
    default:
      return `https://www.google.com/maps/dir/?api=1&destination=${ll}`;
  }
}

export function openDirections(app: NavigationAppId, destination: Destination) {
  return Linking.openURL(buildDirectionsUrl(app, destination));
}
