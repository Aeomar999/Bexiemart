import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

jest.mock("react-native-maps", () => {
  const MockMapView = ({ children }: any) => require("react").createElement("View", { testID: "map-view" }, children);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: ({ children }: any) => require("react").createElement("View", { testID: "marker" }, children),
    Polyline: () => require("react").createElement("View", { testID: "polyline" }),
    PROVIDER_DEFAULT: null,
  };
});

describe("NativeMap", () => {
  it("renders MapView from react-native-maps", () => {
    const MapView = require("./NativeMap").default;
    const { getByTestId } = render(React.createElement(MapView));
    expect(getByTestId("map-view")).toBeTruthy();
  });

  it("exports Marker and Polyline", () => {
    const { Marker, Polyline } = require("./NativeMap");
    const { getByTestId: getM } = render(React.createElement(Marker));
    expect(getM("marker")).toBeTruthy();
    const { getByTestId: getP } = render(React.createElement(Polyline));
    expect(getP("polyline")).toBeTruthy();
  });
});
