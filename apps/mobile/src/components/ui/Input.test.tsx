import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Input } from "./Input";

describe("Input", () => {
  it("renders with label", () => {
    const { getByText } = render(<Input label="Email" />);
    expect(getByText("Email")).toBeTruthy();
  });

  it("renders error message", () => {
    const { getByText } = render(<Input label="Email" error="Invalid email" />);
    expect(getByText("Invalid email")).toBeTruthy();
  });

  it("renders hint when no error", () => {
    const { getByText } = render(<Input label="Email" hint="Enter your email address" />);
    expect(getByText("Enter your email address")).toBeTruthy();
  });

  it("does not render hint when error exists", () => {
    const { queryByText } = render(
      <Input label="Email" hint="Enter your email" error="Required" />
    );
    expect(queryByText("Enter your email")).toBeNull();
  });

  it("shows password toggle when secureTextEntry is true", () => {
    const { getByText } = render(<Input label="Password" secureTextEntry />);
    expect(getByText("Show")).toBeTruthy();
  });

  it("toggles password visibility when Show/Hide pressed", () => {
    const { getByText } = render(<Input label="Password" secureTextEntry />);
    fireEvent.press(getByText("Show"));
    expect(getByText("Hide")).toBeTruthy();
  });
});
