import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { CoverHeader } from "./CoverHeader";

describe("CoverHeader", () => {
  it("renders with an image without crashing", () => {
    const { UNSAFE_root } = render(<CoverHeader imageUrl="https://img/x.jpg" />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it("renders overlaid children", () => {
    const { getByText } = render(
      <CoverHeader imageUrl="https://img/x.jpg" overlay>
        <Text>Hello Store</Text>
      </CoverHeader>
    );
    expect(getByText("Hello Store")).toBeTruthy();
  });

  it("renders a fallback when no image is provided", () => {
    const { UNSAFE_root } = render(<CoverHeader imageUrl={null} fallbackIcon="store" />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
