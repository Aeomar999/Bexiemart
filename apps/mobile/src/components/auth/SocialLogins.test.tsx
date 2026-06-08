import React from "react";
import { render } from "@testing-library/react-native";
import { SocialLogins } from "./SocialLogins";

describe("SocialLogins", () => {
  it("renders or continue with text", () => {
    const { getByText } = render(<SocialLogins />);
    expect(getByText("Or continue with")).toBeTruthy();
  });

  it("renders three social buttons", () => {
    const { getAllByRole } = render(<SocialLogins />);
    expect(getAllByRole("button")).toHaveLength(3);
  });
});
