import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { CategoryCard } from "./CategoryCard";

describe("CategoryCard", () => {
  it("renders category name and count", () => {
    const { getByText } = render(<CategoryCard id="1" name="Electronics" count={42} />);
    expect(getByText("Electronics")).toBeTruthy();
    expect(getByText("42")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <CategoryCard id="1" name="Fashion" count={10} onPress={onPress} />
    );
    fireEvent.press(getByText("Fashion"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders with image thumbnails", () => {
    const imageUrls = [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
      "https://example.com/4.jpg",
    ];
    const { getByText } = render(
      <CategoryCard id="1" name="Shoes" count={25} imageUrls={imageUrls} />
    );
    expect(getByText("Shoes")).toBeTruthy();
  });
});
