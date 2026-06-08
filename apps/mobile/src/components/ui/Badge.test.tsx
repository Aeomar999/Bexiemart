import React from "react";
import { render } from "@testing-library/react-native";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders count badge", () => {
    const { getByText } = render(<Badge count={5} />);
    expect(getByText("5")).toBeTruthy();
  });

  it("renders 99+ for count > 99", () => {
    const { getByText } = render(<Badge count={100} />);
    expect(getByText("99+")).toBeTruthy();
  });

  it("returns null when count is 0", () => {
    const { UNSAFE_root } = render(<Badge count={0} />);
    expect(UNSAFE_root.children.length).toBe(0);
  });

  it("returns null when count is undefined", () => {
    const { UNSAFE_root } = render(<Badge />);
    expect(UNSAFE_root.children.length).toBe(0);
  });

  it("renders status badge with label", () => {
    const { getByText } = render(<Badge variant="status" label="Active" status="success" />);
    expect(getByText("Active")).toBeTruthy();
  });

  it("renders discount badge", () => {
    const { getByText } = render(<Badge variant="discount" label="50% OFF" />);
    expect(getByText("50% OFF")).toBeTruthy();
  });
});
