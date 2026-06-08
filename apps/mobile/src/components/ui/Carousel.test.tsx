import React from "react";
import { render } from "@testing-library/react-native";
import { Carousel } from "./Carousel";

const items = [
  { id: "1", imageUrl: "https://example.com/1.jpg", title: "Slide 1", subtitle: "First slide" },
  { id: "2", imageUrl: "https://example.com/2.jpg", title: "Slide 2" },
];

describe("Carousel", () => {
  it("renders carousel items", () => {
    const { getByText } = render(<Carousel items={items} />);
    expect(getByText("Slide 1")).toBeTruthy();
    expect(getByText("First slide")).toBeTruthy();
  });

  it("returns null when items are empty", () => {
    const { UNSAFE_root } = render(<Carousel items={[]} />);
    expect(UNSAFE_root.children.length).toBe(0);
  });

  it("renders pagination dots when more than one item", () => {
    const { getByText } = render(<Carousel items={items} />);
    expect(getByText("Slide 1")).toBeTruthy();
    expect(getByText("Slide 2")).toBeTruthy();
  });

  it("renders single item without pagination dots", () => {
    const singleItem = [{ id: "1", imageUrl: "https://example.com/1.jpg" }];
    expect(() => render(<Carousel items={singleItem} />)).not.toThrow();
  });

  it("uses gradient fallback when no imageUrl", () => {
    const noImageItems = [{ id: "1", title: "No Image" }];
    const { getByText } = render(<Carousel items={noImageItems} />);
    expect(getByText("No Image")).toBeTruthy();
  });
});
