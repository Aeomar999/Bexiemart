import { Toast } from "../toast-polyfill";
import { usePopupStore } from "../stores/popup-store";

jest.mock("../stores/popup-store", () => {
  const showPopupMock = jest.fn();
  const hidePopupMock = jest.fn();

  return {
    usePopupStore: {
      getState: jest.fn(() => ({
        showPopup: showPopupMock,
        hidePopup: hidePopupMock,
      })),
    },
  };
});

describe("Toast polyfill", () => {
  let showPopupMock: jest.Mock;
  let hidePopupMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const state = usePopupStore.getState();
    showPopupMock = state.showPopup as jest.Mock;
    hidePopupMock = state.hidePopup as jest.Mock;
  });

  it("should map standard toast options to global popup store with success type", () => {
    Toast.show({ type: "success", text1: "Success!", text2: "It worked" });

    expect(showPopupMock).toHaveBeenCalledWith({
      type: "success",
      title: "Success!",
      message: "It worked",
    });
  });

  it("should default to info type if unknown type is provided", () => {
    Toast.show({ type: "unknown", text1: "Title" });

    expect(showPopupMock).toHaveBeenCalledWith({
      type: "info",
      title: "Title",
      message: "",
    });
  });

  it("should default title to Notification if text1 is not provided", () => {
    Toast.show({ type: "error" });

    expect(showPopupMock).toHaveBeenCalledWith({
      type: "error",
      title: "Notification",
      message: "",
    });
  });

  it("should hide popup when hide is called", () => {
    Toast.hide();

    expect(hidePopupMock).toHaveBeenCalled();
  });
});
