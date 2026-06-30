import React from "react";
import { render } from "@testing-library/react-native";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("defaults to a skeleton, not a spinner message", () => {
    const { queryByText } = render(<LoadingState />);
    // Skeletons have no text label; the default must not flash a bare spinner.
    expect(queryByText("Loading...")).toBeNull();
  });

  it("renders spinner with default message when type=spinner", () => {
    const { getByText } = render(<LoadingState type="spinner" />);
    expect(getByText("Loading...")).toBeTruthy();
  });

  it("renders custom spinner message", () => {
    const { getByText } = render(<LoadingState type="spinner" message="Please wait..." />);
    expect(getByText("Please wait...")).toBeTruthy();
  });

  it("renders list skeleton variant", () => {
    expect(() => render(<LoadingState type="list" />)).not.toThrow();
  });

  it("renders detail skeleton variant", () => {
    expect(() => render(<LoadingState type="detail" />)).not.toThrow();
  });

  it("renders profile skeleton variant", () => {
    expect(() => render(<LoadingState type="profile" />)).not.toThrow();
  });

  it("renders grid skeleton variant", () => {
    expect(() => render(<LoadingState type="grid" />)).not.toThrow();
  });
});
