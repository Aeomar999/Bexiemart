import React from "react";
import { render } from "@testing-library/react-native";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("renders spinner by default with message", () => {
    const { getByText } = render(<LoadingState />);
    expect(getByText("Loading...")).toBeTruthy();
  });

  it("renders custom message", () => {
    const { getByText } = render(<LoadingState message="Please wait..." />);
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
});
