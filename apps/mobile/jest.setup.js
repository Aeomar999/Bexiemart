import "@testing-library/jest-native/extend-expect";

// ──────────────────────────────────────────────────
// Native Module Mocks
// ──────────────────────────────────────────────────

// AsyncStorage — inline mock (the jest/async-storage-mock path may not exist)
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
  },
}));

// expo-secure-store — used by auth-store and api/client
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// ──────────────────────────────────────────────────
// Expo Modules
// ──────────────────────────────────────────────────

// expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
  Link: "Link",
  Redirect: "Redirect",
}));

// @expo/vector-icons — handled by moduleNameMapper in jest.config.js
// → __mocks__/@expo/vector-icons.js

// expo-image — renders a plain <View> with testID
jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: React.forwardRef((props, ref) =>
      React.createElement(View, {
        ref,
        testID: props.testID || "expo-image",
        style: props.style,
        accessibilityLabel: props.accessibilityLabel,
      })
    ),
  };
});

// expo-linear-gradient
jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: React.forwardRef((props, ref) =>
      React.createElement(View, { ref, style: props.style, testID: "linear-gradient" }, props.children)
    ),
  };
});

// expo-blur
jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BlurView: React.forwardRef((props, ref) =>
      React.createElement(View, { ref, style: props.style, testID: "blur-view" }, props.children)
    ),
  };
});

// expo-clipboard
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
  getStringAsync: jest.fn(() => Promise.resolve("")),
  hasStringAsync: jest.fn(() => Promise.resolve(false)),
}));

// expo-image-picker
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: null })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: null })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted", granted: true })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted", granted: true })
  ),
  MediaTypeOptions: { Images: "Images", Videos: "Videos", All: "All" },
}));

// expo-location
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 0, longitude: 0 } })
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([{ city: "Test City", country: "Test Country", street: "Test Street" }])
  ),
}));

// expo-file-system
jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/document/directory/",
  cacheDirectory: "/mock/cache/directory/",
  readAsStringAsync: jest.fn(() => Promise.resolve("")),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false, isDirectory: false })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  downloadAsync: jest.fn(() => Promise.resolve({ uri: "/mock/downloaded/file" })),
}));

// expo-web-browser
jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: "cancel" })),
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: "cancel" })),
  maybeCompleteAuthSession: jest.fn(() => ({ type: "dismiss" })),
}));

// expo-linking
jest.mock("expo-linking", () => ({
  createURL: jest.fn((path) => `bexiemart://${path}`),
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
}));

// expo-splash-screen
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// expo-constants
jest.mock("expo-constants", () => ({
  expoConfig: { extra: {} },
  manifest: null,
}));

// expo-application
jest.mock("expo-application", () => ({
  applicationId: "com.bexiemart.test",
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "1",
}));

// expo-device
jest.mock("expo-device", () => ({
  osBuildId: "test-build-id",
  osName: "iOS",
  osVersion: "17.0",
  modelName: "iPhone 15",
  isDevice: false,
}));

// ──────────────────────────────────────────────────
// React Native Modules
// ──────────────────────────────────────────────────

// react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    useSafeAreaInsets: jest.fn().mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, style }) => React.createElement(View, { style }, children),
  };
});

// react-native-reanimated — use the built-in jest mock
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View, TouchableOpacity, ScrollView } = require("react-native");
  return {
    GestureHandlerRootView: ({ children }) => React.createElement(View, null, children),
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    NativeViewGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    ScrollView: ScrollView,
    RectButton: TouchableOpacity,
    BaseButton: TouchableOpacity,
    BorderlessButton: TouchableOpacity,
    TouchableOpacity: TouchableOpacity,
    Directions: {},
    gestureHandlerRootHOC: jest.fn((component) => component),
  };
});

// react-native-maps
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MapView = React.forwardRef((props, ref) =>
    React.createElement(View, { ref, testID: "map-view", ...props })
  );
  MapView.Marker = (props) => React.createElement(View, { testID: "map-marker", ...props });
  MapView.Callout = (props) => React.createElement(View, { testID: "map-callout", ...props });
  return {
    __esModule: true,
    default: MapView,
    Marker: MapView.Marker,
    Callout: MapView.Callout,
    PROVIDER_GOOGLE: "google",
  };
});

// react-native-toast-message
jest.mock("react-native-toast-message", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Toast = (props) => React.createElement(View, { testID: "toast" });
  Toast.show = jest.fn();
  Toast.hide = jest.fn();
  return {
    __esModule: true,
    default: Toast,
  };
});

// ──────────────────────────────────────────────────
// Third-Party SDKs
// ──────────────────────────────────────────────────

// @sentry/react-native
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback) => callback({ setExtra: jest.fn() })),
  Severity: { Error: "error", Warning: "warning", Info: "info" },
}));

// posthog-react-native
jest.mock("posthog-react-native", () => {
  return jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    screen: jest.fn(),
    reset: jest.fn(),
    flush: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
  }));
});

// socket.io-client
jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  })),
}));

// better-auth/client
jest.mock("better-auth/client", () => ({
  createAuthClient: jest.fn(() => ({
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(() => Promise.resolve({ data: null })),
    getSession: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}));

jest.mock("better-auth/client/plugins", () => ({
  phoneNumberClient: jest.fn(() => ({})),
}));

jest.mock("@better-auth/infra/native", () => ({
  dashClient: jest.fn(() => ({})),
  sentinelNativeClient: jest.fn(() => ({})),
}));

// @react-native-community/netinfo
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: "wifi",
    })
  ),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: "wifi",
  })),
}));

// react-native-paystack-webview
jest.mock("react-native-paystack-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) =>
      React.createElement(View, { ref, testID: "paystack-webview" })
    ),
    Paystack: React.forwardRef((props, ref) =>
      React.createElement(View, { ref, testID: "paystack" })
    ),
  };
});

// react-native-webview
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) =>
      React.createElement(View, { ref, testID: "webview" })
    ),
  };
});

// ──────────────────────────────────────────────────
// Application Stores (supports zustand selectors)
// ──────────────────────────────────────────────────

const mockAuthData = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  hasLaunchedBefore: false,
  hasSeenOnboarding: false,
  setAuth: jest.fn(),
  setUser: jest.fn(),
  logout: jest.fn(),
  hydrate: jest.fn(),
  completeLaunch: jest.fn(),
  completeOnboarding: jest.fn(),
};
jest.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: jest.fn((selector) => {
    return selector ? selector(mockAuthData) : mockAuthData;
  }),
}));

const mockCartData = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  setItems: jest.fn(),
  addItem: jest.fn(),
  updateQuantity: jest.fn(),
  removeItem: jest.fn(),
  clearCart: jest.fn(),
};
jest.mock("@/lib/stores/cart-store", () => ({
  useCartStore: jest.fn((selector) => {
    return selector ? selector(mockCartData) : mockCartData;
  }),
}));

// ──────────────────────────────────────────────────
// NativeWind / global CSS — prevent CSS parse errors
// ──────────────────────────────────────────────────
jest.mock("nativewind", () => ({
  styled: (component) => component,
  useColorScheme: jest.fn(() => ({ colorScheme: "light", toggleColorScheme: jest.fn() })),
}));

// ──────────────────────────────────────────────────
// Suppress noisy console warnings in test output
// ──────────────────────────────────────────────────
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    const message = typeof args[0] === "string" ? args[0] : "";
    if (
      message.includes("Animated:") ||
      message.includes("NativeWind") ||
      message.includes("useNativeDriver")
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  console.error = (...args) => {
    const message = typeof args[0] === "string" ? args[0] : "";
    if (
      message.includes("Warning: An update to") ||
      message.includes("act(...)") ||
      message.includes("NativeWind")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
