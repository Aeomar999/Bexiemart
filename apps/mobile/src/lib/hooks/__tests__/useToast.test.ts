import { renderHook, act } from "@testing-library/react-native";
import { useToast } from "../use-toast";
import { usePopupStore } from "../../stores/popup-store";

jest.mock("../../stores/popup-store", () => ({
  usePopupStore: jest.fn(),
}));

describe("useToast", () => {
  const mockShowPopup = jest.fn();
  const mockHidePopup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePopupStore as unknown as jest.Mock).mockReturnValue({
      showPopup: mockShowPopup,
      hidePopup: mockHidePopup,
    });
  });

  it("should show a toast popup", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.show({
        type: "success" as any,
        title: "Success!",
        message: "Action completed",
      });
    });

    expect(mockShowPopup).toHaveBeenCalledWith({
      type: "success",
      title: "Success!",
      message: "Action completed",
    });
  });

  it("should hide popup", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.hide();
    });

    expect(mockHidePopup).toHaveBeenCalled();
  });
});
