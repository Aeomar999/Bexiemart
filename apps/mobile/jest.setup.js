import "@testing-library/jest-native/extend-expect";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn().mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock useAuthStore
jest.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
  })),
}));
