import React from "react";
import { render } from "@testing-library/react-native";
import { CloudinaryImage } from "./CloudinaryImage";

jest.mock("@cloudinary/url-gen", () => {
  const mockImage = {
    resize: jest.fn(() => mockImage),
    delivery: jest.fn(() => mockImage),
    toURL: jest.fn(() => "https://res.cloudinary.com/test/image.jpg"),
  };
  return {
    Cloudinary: jest.fn(() => ({
      image: jest.fn(() => mockImage),
    })),
  };
});

jest.mock("@cloudinary/url-gen/actions/resize", () => {
  const mockAction = {
    width: jest.fn(() => mockAction),
    height: jest.fn(() => mockAction),
  };
  return { fill: jest.fn(() => mockAction) };
});

jest.mock("@cloudinary/url-gen/actions/delivery", () => ({ format: jest.fn(() => ({})), quality: jest.fn(() => ({})) }));
jest.mock("@cloudinary/url-gen/qualifiers/format", () => ({ auto: jest.fn() }));
jest.mock("@cloudinary/url-gen/qualifiers/quality", () => ({ auto: jest.fn() }));

describe("CloudinaryImage", () => {
  it("returns null when publicId is null", () => {
    const { UNSAFE_root } = render(<CloudinaryImage publicId={null} />);
    expect(UNSAFE_root.children.length).toBe(0);
  });

  it("renders direct URL when publicId starts with http", () => {
    expect(() => render(<CloudinaryImage publicId="https://example.com/image.jpg" />)).not.toThrow();
  });

  it("renders Cloudinary transformed image", () => {
    expect(() => render(<CloudinaryImage publicId="products/abc123" width={300} height={200} />)).not.toThrow();
  });
});
