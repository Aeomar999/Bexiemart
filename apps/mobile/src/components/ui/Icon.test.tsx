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

  it("maps arrow-up-right to the up-right arrow, not the fallback", () => {
    const upRight = render(<Icon name="arrow-up-right" />).toJSON();
    const trendingUp = render(<Icon name="trending-up" />).toJSON();
    const fallback = render(<Icon name="apps" />).toJSON();
    expect(upRight).toEqual(trendingUp);
    expect(upRight).not.toEqual(fallback);
  });
});
