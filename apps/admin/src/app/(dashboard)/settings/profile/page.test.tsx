/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileSettingsPage from "./page";
import { useAuthStore } from "../../../../lib/stores/auth-store";
import { useUpdateProfile, useUploadAvatar } from "../../../../lib/hooks/use-profile";

jest.mock("../../../../lib/stores/auth-store", () => ({ useAuthStore: jest.fn() }));
jest.mock("../../../../lib/hooks/use-profile", () => ({
  useUpdateProfile: jest.fn(),
  useUploadAvatar: jest.fn(),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const user = { id: "1", name: "Ada Admin", email: "ada@bexiemart.com", image: "" };
const mockUpdate = jest.fn();
const mockSetAuth = jest.fn();

describe("ProfileSettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockImplementation(
      (selector: (s: unknown) => unknown) => selector({ user, setAuth: mockSetAuth })
    );
    (useUpdateProfile as jest.Mock).mockReturnValue({ mutate: mockUpdate, isPending: false });
    (useUploadAvatar as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
  });

  it("disables Save profile until something changes", () => {
    render(<ProfileSettingsPage />);
    const save = screen.getByRole("button", { name: "Save profile" });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByDisplayValue("Ada Admin"), { target: { value: "Ada Lovelace" } });

    expect(save).toBeEnabled();
  });

  it("disables Save profile when the name is blank", () => {
    render(<ProfileSettingsPage />);
    fireEvent.change(screen.getByDisplayValue("Ada Admin"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled();
  });

  it("saves the trimmed name", () => {
    render(<ProfileSettingsPage />);
    fireEvent.change(screen.getByDisplayValue("Ada Admin"), { target: { value: "  Ada L  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(mockUpdate).toHaveBeenCalledWith({ name: "Ada L", image: "" }, expect.any(Object));
  });

  it("opens the file picker from the Change photo button", () => {
    const clickSpy = jest
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(() => {});
    render(<ProfileSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Change photo" }));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
