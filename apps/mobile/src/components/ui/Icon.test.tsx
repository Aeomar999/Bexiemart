import React from "react";
import { render } from "@testing-library/react-native";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("renders with given name", () => {
    expect(() => render(<Icon name="home" />)).not.toThrow();
  });

  it("renders with mapped icon name", () => {
    expect(() => render(<Icon name="Heart" />)).not.toThrow();
  });
});
