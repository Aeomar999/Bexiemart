import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/admin", () => ({
  adminApi: {
    getUsers: jest.fn(),
    getUser: jest.fn(),
    updateUserRole: jest.fn(),
    getVendors: jest.fn(),
    approveVendor: jest.fn(),
    suspendVendor: jest.fn(),
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    getOrders: jest.fn(),
    getOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
  },
}));;

import { useAdminUsers, useAdminUser, useUpdateUserRole, useAdminVendors, useApproveVendor, useSuspendVendor, useAdminConfig, useUpdateAdminConfig, useAdminOrders, useAdminOrder, useUpdateOrderStatus } from "../use-admin";
import { adminApi } from "../../api/admin";
import { createWrapper } from "./test-utils";

describe("useAdminUsers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch paginated admin users on mount", async () => {
    (adminApi.getUsers as jest.Mock).mockResolvedValue({ data: { data: [{ id: "u1", name: "Admin", role: "user" }] } });
    const { result} = renderHook(() => useAdminUsers(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "u1", name: "Admin", role: "user" }]);
  });

  it("should handle fetch error", async () => {
    (adminApi.getUsers as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useAdminUsers(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useAdminUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch single user by id", async () => {
    (adminApi.getUser as jest.Mock).mockResolvedValue({ data: { id: "u1", name: "User 1", email: "user1@test.com" } });
    const { result} = renderHook(() => useAdminUser("u1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(adminApi.getUser).toHaveBeenCalledWith("u1");
    expect(result.current.data).toEqual({ id: "u1", name: "User 1", email: "user1@test.com" });
  });

  it("should not fetch when no id provided", async () => {
    renderHook(() => useAdminUser(""), { wrapper: createWrapper() });
    expect(adminApi.getUser).not.toHaveBeenCalled();
  });
});

describe("useUpdateUserRole", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should mutate user role and invalidate users cache", async () => {
    (adminApi.updateUserRole as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useUpdateUserRole(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "u1", role: "admin" });
    expect(adminApi.updateUserRole).toHaveBeenCalledWith("u1", "admin");
  });
});

describe("useAdminOrders", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch orders with status and pagination", async () => {
    (adminApi.getOrders as jest.Mock).mockResolvedValue({ data: { data: [{ id: "o1", total: 5000 }] } });
    const { result} = renderHook(() => useAdminOrders("pending", 1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(adminApi.getOrders).toHaveBeenCalledWith("pending", 1);
    expect(result.current.data).toEqual([{ id: "o1", total: 5000 }]);
  });
});
