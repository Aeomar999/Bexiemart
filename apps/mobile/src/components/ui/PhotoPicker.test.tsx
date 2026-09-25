import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PhotoPicker, PickerImage } from "./PhotoPicker";

const mockLaunchImageLibraryAsync = jest.fn();
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (...args: any[]) => mockLaunchImageLibraryAsync(...args),
  MediaTypeOptions: { Images: "Images" },
}));

describe("PhotoPicker", () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders add photos button when no images", () => {
    const { getByText } = render(<PhotoPicker images={[]} onChange={onChange} />);
    expect(getByText("Add Photos")).toBeTruthy();
  });

  it("renders existing images", () => {
    const images: PickerImage[] = [
      { uri: "https://example.com/1.jpg", type: "image/jpeg", name: "photo1.jpg" },
    ];
    expect(() => render(<PhotoPicker images={images} onChange={onChange} />)).not.toThrow();
  });

  it("calls onChange when image picked", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://new.jpg", mimeType: "image/jpeg", fileName: "new.jpg" }],
    });

    const { getByText } = render(<PhotoPicker images={[]} onChange={onChange} />);

    // Mock Alert.alert to instantly call the second option (Gallery)
    const alertSpy = jest.spyOn(require("react-native").Alert, "alert");
    // @ts-ignore
    alertSpy.mockImplementation((title: any, message: any, buttons: any) => {
      // Find the Gallery button and call its onPress
      const galleryButton = buttons?.find((b: any) => b.text === "Gallery");
      if (galleryButton && galleryButton.onPress) {
        galleryButton.onPress();
      }
    });

    fireEvent.press(getByText("Add Photos"));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([
        { uri: "file://new.jpg", type: "image/jpeg", name: "new.jpg" },
      ]);
    });

    alertSpy.mockRestore();
  });

  it("hides add button when max selections reached", () => {
    const images: PickerImage[] = Array.from({ length: 5 }, (_, i) => ({
      uri: `https://example.com/${i}.jpg`,
      type: "image/jpeg",
      name: `photo${i}.jpg`,
    }));

    const { queryByText } = render(
      <PhotoPicker images={images} onChange={onChange} maxSelections={5} />
    );

    expect(queryByText("Add Photos")).toBeNull();
  });
});
