import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useImagePicker } from "../use-image-picker";

jest.mock("expo-image-picker");
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useImagePicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useImagePicker());
    expect(result.current.image).toBeNull();
    expect(result.current.images).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  describe("pickImage", () => {
    it("should return null if permission denied", async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      const { result } = renderHook(() => useImagePicker());
      let file;
      await act(async () => {
        file = await result.current.pickImage();
      });

      expect(file).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permission needed",
        "Camera roll permission is required to select photos."
      );
    });

    it("should pick an image successfully", async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://test.jpg", fileName: "test.jpg", mimeType: "image/jpeg" }],
      });

      const { result } = renderHook(() => useImagePicker());
      let file;
      await act(async () => {
        file = await result.current.pickImage();
      });

      expect(file).toEqual({ uri: "file://test.jpg", name: "test.jpg", type: "image/jpeg" });
      expect(result.current.image).toBe("file://test.jpg");
    });

    it("should handle multiple selection", async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          { uri: "file://test1.jpg", fileName: "test1.jpg", mimeType: "image/jpeg" },
          { uri: "file://test2.jpg", fileName: "test2.jpg", mimeType: "image/jpeg" },
        ],
      });

      const { result } = renderHook(() => useImagePicker({ allowsMultipleSelection: true }));
      let files;
      await act(async () => {
        files = await result.current.pickImage();
      });

      expect(files).toEqual([
        { uri: "file://test1.jpg", name: "test1.jpg", type: "image/jpeg" },
        { uri: "file://test2.jpg", name: "test2.jpg", type: "image/jpeg" },
      ]);
      expect(result.current.images).toEqual(["file://test1.jpg", "file://test2.jpg"]);
    });
  });

  describe("takePhoto", () => {
    it("should return null if permission denied", async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      const { result } = renderHook(() => useImagePicker());
      let file;
      await act(async () => {
        file = await result.current.takePhoto();
      });

      expect(file).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permission needed",
        "Camera permission is required to take photos."
      );
    });

    it("should take a photo successfully", async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://photo.jpg", fileName: "photo.jpg", mimeType: "image/jpeg" }],
      });

      const { result } = renderHook(() => useImagePicker());
      let file;
      await act(async () => {
        file = await result.current.takePhoto();
      });

      expect(file).toEqual({ uri: "file://photo.jpg", name: "photo.jpg", type: "image/jpeg" });
      expect(result.current.image).toBe("file://photo.jpg");
    });
  });
});
