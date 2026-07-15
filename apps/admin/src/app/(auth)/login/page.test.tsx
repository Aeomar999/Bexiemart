import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";
import { useLogin } from "../../../lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

jest.mock("../../../lib/hooks/use-auth", () => ({
  useLogin: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe("LoginPage", () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useLogin as jest.Mock).mockReturnValue({ mutate: mockLogin, isPending: false });
  });

  it("renders email and password form initially", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("switches to TOTP verification screen when login returns requiresTwoFactor", () => {
    mockLogin.mockImplementation((credentials, { onSuccess }) => {
      onSuccess({ requiresTwoFactor: true });
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    expect(screen.getByText("Two-Factor Authentication")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
  });
});
