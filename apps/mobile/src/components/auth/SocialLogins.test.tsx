import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { SocialLogins } from "./SocialLogins";
import { authClient } from "../../lib/api/better-auth";

jest.mock("../../lib/api/better-auth", () => ({
  authClient: {
    signIn: {
      social: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
    getSession: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

jest.mock("../../lib/stores/auth-store", () => ({
  useAuthStore: () => ({
    setAuth: jest.fn(),
  }),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

describe("SocialLogins", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders or continue with text", () => {
    const { getByText } = render(<SocialLogins />);
    expect(getByText("Or continue with")).toBeTruthy();
  });

  it("renders three social buttons", () => {
    const { getAllByRole } = render(<SocialLogins />);
    expect(getAllByRole("button")).toHaveLength(3);
  });

  it("calls authClient.signIn.social when Google button is pressed", async () => {
    const { getAllByRole } = render(<SocialLogins roleIntent="vendor" />);
    const buttons = getAllByRole("button");
    // Buttons: Apple (0), Google (1), Facebook (2)
    fireEvent.press(buttons[1]);

    await waitFor(
      () => {
        expect(authClient.signIn.social).toHaveBeenCalledWith({
          provider: "google",
          callbackURL: "bexiemart://auth/callback?intent=vendor",
        });
      },
      { timeout: 8000 }
    );
  }, 10000);
});
