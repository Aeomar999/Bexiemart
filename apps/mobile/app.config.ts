import fs from "fs";
import path from "path";

type AppJson = {
  expo: Record<string, unknown>;
};

const appJsonPath = path.join(__dirname, "app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8")) as AppJson;

const googleMapsIOSKey = process.env.GOOGLE_MAPS_IOS_API_KEY;
const googleMapsAndroidKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

if (!googleMapsIOSKey || !googleMapsAndroidKey) {
  console.warn(
    "[app.config] Google Maps API keys are not set. Set GOOGLE_MAPS_IOS_API_KEY and " +
      "GOOGLE_MAPS_ANDROID_API_KEY (locally in .env, or via `eas env:create`) or map views will be blank."
  );
}

const iosConfigSource =
  (appJson.expo.ios as { config?: Record<string, unknown> } | undefined)?.config ?? {};
const androidConfigSource =
  (appJson.expo.android as { config?: Record<string, unknown> } | undefined)?.config ?? {};

// Strip static placeholder values so keys come exclusively from the environment.
const { googleMapsApiKey: _iosPlaceholder, ...iosConfigBase } = iosConfigSource as {
  googleMapsApiKey?: string;
};
const { apiKey: _androidPlaceholder, ...androidGoogleMapsBase } = (androidConfigSource.googleMaps ??
  {}) as { apiKey?: string };

const iosConfig: Record<string, unknown> = {
  ...iosConfigBase,
  ...(googleMapsIOSKey ? { googleMapsApiKey: googleMapsIOSKey } : {}),
};

const iosRest = (appJson.expo.ios as Record<string, unknown>) || {};
const androidRest = (appJson.expo.android as Record<string, unknown>) || {};

export default {
  expo: {
    ...appJson.expo,
    ios: {
      ...iosRest,
      config: iosConfig,
    },
    android: {
      ...androidRest,
      config: {
        ...androidConfigSource,
        googleMaps: {
          ...androidGoogleMapsBase,
          ...(googleMapsAndroidKey ? { apiKey: googleMapsAndroidKey } : {}),
        },
      },
    },
  },
};
