import React from "react";
import { render } from "@testing-library/react-native";
import {
  Skeleton,
  ProductCardSkeleton,
  CartItemSkeleton,
  ListSkeleton,
  DetailSkeleton,
  ProfileSkeleton,
} from "./Skeleton";

describe("Skeleton", () => {
  it("renders animated skeleton", () => {
    expect(() => render(<Skeleton />)).not.toThrow();
  });

  it("accepts custom width and height", () => {
    expect(() => render(<Skeleton width={100} height={50} />)).not.toThrow();
  });
});

describe("ProductCardSkeleton", () => {
  it("renders without crashing", () => {
    expect(() => render(<ProductCardSkeleton />)).not.toThrow();
  });
});

describe("CartItemSkeleton", () => {
  it("renders without crashing", () => {
    expect(() => render(<CartItemSkeleton />)).not.toThrow();
  });
});

describe("ListSkeleton", () => {
  it("renders without crashing", () => {
    expect(() => render(<ListSkeleton />)).not.toThrow();
  });
});

describe("DetailSkeleton", () => {
  it("renders without crashing", () => {
    expect(() => render(<DetailSkeleton />)).not.toThrow();
  });
});

describe("ProfileSkeleton", () => {
  it("renders without crashing", () => {
    expect(() => render(<ProfileSkeleton />)).not.toThrow();
  });
});
