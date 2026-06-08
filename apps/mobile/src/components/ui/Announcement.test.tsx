import React from "react";
import { render } from "@testing-library/react-native";
import { Announcement } from "./Announcement";

describe("Announcement", () => {
  it("renders message for error type (default)", () => {
    const { getByText } = render(<Announcement message="Something went wrong" />);
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("renders success type", () => {
    const { getByText } = render(<Announcement type="success" message="Operation successful" />);
    expect(getByText("Operation successful")).toBeTruthy();
  });

  it("renders warning type", () => {
    const { getByText } = render(<Announcement type="warning" message="Please check your input" />);
    expect(getByText("Please check your input")).toBeTruthy();
  });

  it("renders info type", () => {
    const { getByText } = render(<Announcement type="info" message="New update available" />);
    expect(getByText("New update available")).toBeTruthy();
  });

  it("returns null when message is empty", () => {
    const { UNSAFE_root } = render(<Announcement message="" />);
    expect(UNSAFE_root.children.length).toBe(0);
  });
});
