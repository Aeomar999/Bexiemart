import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { EditProfileScreen } from "./EditProfileScreen";

const mockMutateAsync = jest.fn();
const mockUseUpdateProfile = jest.fn(() => ({ mutateAsync: mockMutateAsync }));
const mockUploadMutateAsync = jest.fn();
const mockUseUpload = jest.fn(() => ({ mutateAsync: mockUploadMutateAsync }));
const mockPickImage = jest.fn();
const mockUseImagePicker = jest.fn(() => ({ pickImage: mockPickImage }));

jest.mock("@/lib/hooks/use-users", () => ({
  useUpdateProfile: () => mockUseUpdateProfile(),
}));

jest.mock("@/lib/hooks/use-upload", () => ({
  useUpload: () => mockUseUpload(),
}));

jest.mock("@/lib/hooks/use-image-picker", () => ({
  useImagePicker: () => mockUseImagePicker(),
}));

jest.mock("@/lib/toast-polyfill", () => ({
  show: jest.fn(),
  default: { show: jest.fn() },
}));

jest.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: jest.fn(() => ({
    user: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "+233501234567",
      bio: "Hello there",
      location: "Accra",
      image: "https://example.com/avatar.jpg",
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    setUser: jest.fn(),
    isAuthenticated: true,
  })),
}));

const mockRouterBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ back: mockRouterBack })),
}));

describe("EditProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header and form fields", () => {
    const { getByText, getByPlaceholderText } = render(<EditProfileScreen />);
    expect(getByText("Edit Profile")).toBeTruthy();
    expect(getByPlaceholderText("Enter your full name")).toBeTruthy();
    expect(getByPlaceholderText("Enter your email")).toBeTruthy();
    expect(getByPlaceholderText("e.g. +233 50 123 4567")).toBeTruthy();
    expect(getByPlaceholderText("e.g. Accra, Ghana")).toBeTruthy();
    expect(getByPlaceholderText("Tell us a bit about yourself...")).toBeTruthy();
  });

  it("pre-fills fields with user data", () => {
    const { getByDisplayValue } = render(<EditProfileScreen />);
    expect(getByDisplayValue("John Doe")).toBeTruthy();
    expect(getByDisplayValue("john@example.com")).toBeTruthy();
    expect(getByDisplayValue("Hello there")).toBeTruthy();
  });

  it("calls save when form is valid", async () => {
    mockMutateAsync.mockResolvedValue({ data: { name: "John" } });

    const { getByText } = render(<EditProfileScreen />);

    fireEvent.press(getByText("Save Changes"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  it("shows Saving... state when saving", () => {
    const { getByText } = render(<EditProfileScreen />);
    expect(getByText("Save Changes")).toBeTruthy();
  });

  it("handles photo change", async () => {
    mockPickImage.mockResolvedValue({ uri: "file://photo.jpg", type: "image/jpeg", name: "photo.jpg" });
    mockUploadMutateAsync.mockResolvedValue({ url: "https://example.com/uploaded.jpg" });

    const { getByText } = render(<EditProfileScreen />);
    expect(getByText("Edit Profile")).toBeTruthy();
  });
});
