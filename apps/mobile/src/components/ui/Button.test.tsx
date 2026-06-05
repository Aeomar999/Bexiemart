import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "./Button";

describe("Button Component", () => {
  it("renders correctly with title", () => {
    const { getByText } = render(<Button title="Click Me" onPress={() => {}} />);
    expect(getByText("Click Me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Press Test" onPress={onPressMock} />);

    fireEvent.press(getByText("Press Test"));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it("disables the button when loading", () => {
    const onPressMock = jest.fn();
    const { getByTestId, queryByText } = render(
      <Button title="Load Test" onPress={onPressMock} loading={true} testID="custom-button" />
    );

    // When loading, the title might be hidden or replaced with an indicator,
    // but the button itself should not trigger onPress.
    const button = getByTestId("custom-button");
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it("disables the button when disabled prop is true", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Disabled Test" onPress={onPressMock} disabled={true} />
    );

    fireEvent.press(getByText("Disabled Test"));
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
