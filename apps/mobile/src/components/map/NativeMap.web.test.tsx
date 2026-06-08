import React from "react";
import { render } from "@testing-library/react-native";
import MapView, { Marker } from "./NativeMap.web";

describe("NativeMap.web", () => {
  it("renders web fallback message", () => {
    const { getByText } = render(<MapView />);
    expect(getByText("Map view is not supported on Web")).toBeTruthy();
  });

  it("renders description text", () => {
    const { getByText } = render(<MapView />);
    expect(
      getByText("Please use the Bexiemart mobile app on an iOS or Android device to view the map.")
    ).toBeTruthy();
  });

  it("renders children hidden", () => {
    const { UNSAFE_root } = render(
      <MapView>
        <Marker>Child</Marker>
      </MapView>
    );
    expect(UNSAFE_root.children.length).toBeGreaterThan(0);
  });
});
