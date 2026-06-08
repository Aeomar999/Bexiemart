jest.unmock("@/lib/stores/popup-store");
import { usePopupStore } from "./popup-store";

describe("Popup Store", () => {
  beforeEach(() => {
    usePopupStore.setState({ isVisible: false, type: "success", title: "", message: "" });
  });

  it("should show popup with given params", () => {
    usePopupStore.getState().showPopup({ type: "error", title: "Error", message: "Something went wrong" });
    const state = usePopupStore.getState();
    expect(state.isVisible).toBe(true);
    expect(state.type).toBe("error");
    expect(state.title).toBe("Error");
    expect(state.message).toBe("Something went wrong");
  });

  it("should hide popup", () => {
    usePopupStore.setState({ isVisible: true, type: "info", title: "Info", message: "Hello" });
    usePopupStore.getState().hidePopup();
    expect(usePopupStore.getState().isVisible).toBe(false);
  });

  it("should switch between show and hide", () => {
    usePopupStore.getState().showPopup({ type: "success", title: "Done", message: "All good" });
    expect(usePopupStore.getState().isVisible).toBe(true);
    usePopupStore.getState().hidePopup();
    expect(usePopupStore.getState().isVisible).toBe(false);
  });
});
