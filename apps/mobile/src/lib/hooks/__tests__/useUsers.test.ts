import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/users", () => ({
  usersApi: {
    getMe: jest.fn(),
    updateProfile: jest.fn(),
  },
}));;

import { useMe, useUpdateProfile } from "../use-users";
import { usersApi } from "../../api/users";
import { createWrapper } from "./test-utils";

describe("useMe", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch user profile on mount", async () => {
    (usersApi.getMe as jest.Mock).mockResolvedValue({ data: { id: "u1", name: "Test User" } });
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return user data on success", async () => {
    (usersApi.getMe as jest.Mock).mockResolvedValue({ data: { id: "u1", name: "Test User", email: "test@test.com" } });
    const { result} = renderHook(() => useMe(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ id: "u1", name: "Test User", email: "test@test.com" });
  });

  it("should handle fetch error", async () => {
    (usersApi.getMe as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useMe(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useUpdateProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call updateProfile mutation with profile data", async () => {
    (usersApi.updateProfile as jest.Mock).mockResolvedValue({ data: { id: "u1", name: "Updated" } });
    const { result} = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "Updated" });
    expect(usersApi.updateProfile).toHaveBeenCalledWith({ name: "Updated" });
  });
});
