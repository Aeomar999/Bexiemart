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

  it("renders the Google social button", () => {
    const { getByRole, getByText } = render(<SocialLogins />);
    expect(getByRole("button")).toBeTruthy();
    expect(getByText("Continue with Google")).toBeTruthy();
  });

  it("calls authClient.signIn.social when Google button is pressed", async () => {
    const { getByRole } = render(<SocialLogins />);
    const button = getByRole("button");
    fireEvent.press(button);

    await waitFor(
      () => {
        expect(authClient.signIn.social).toHaveBeenCalledWith({
          provider: "google",
          callbackURL: "bexiemart://auth/callback",
        });
      },
      { timeout: 8000 }
    );
  }, 10000);
});
