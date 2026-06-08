import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { Card } from "./Card";

describe("Card", () => {
  it("renders children", () => {
    const { getByText } = render(
      <Card>
        <Text>Hello</Text>
      </Card>
    );
    expect(getByText("Hello")).toBeTruthy();
  });

  it("renders with elevated variant by default", () => {
    const { getByTestId } = render(
      <Card testID="card">
        <Text>Content</Text>
      </Card>
    );
    expect(getByTestId("card")).toBeTruthy();
  });
});
