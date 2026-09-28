import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/dispatcher", () => ({
  dispatcherApi: {
    getProfile: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    getAvailableTasks: jest.fn(),
    getMyTasks: jest.fn(),
    acceptTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    updateStatus: jest.fn(),
    getEarnings: jest.fn(),
    getTransactions: jest.fn(),
    getAnalytics: jest.fn(),
    withdrawEarnings: jest.fn(),
  },
}));

import {
  useDispatcherProfile,
  useCreateDispatcherProfile,
  useUpdateDispatcherProfile,
  useSetDispatcherStatus,
  DISPATCHER_KEYS,
  useAvailableTasks,
  useMyTasks,
  useAcceptTask,
  useUpdateTaskStatus,
  useDispatcherEarnings,
  useDispatcherTransactions,
  useDispatcherAnalytics,
} from "../use-dispatcher";
import { dispatcherApi } from "../../api/dispatcher";
import { createWrapper } from "./test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("useDispatcherProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch profile data", async () => {
    (dispatcherApi.getProfile as jest.Mock).mockResolvedValue({
      data: { id: "disp-1", vehicleType: "car" },
    });
    const { result } = renderHook(() => useDispatcherProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ id: "disp-1", vehicleType: "car" });
  });
});

describe("useCreateDispatcherProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create dispatcher profile mutation", async () => {
    (dispatcherApi.createProfile as jest.Mock).mockResolvedValue({
      data: { id: "d1", status: "active" },
    });
    const { result } = renderHook(() => useCreateDispatcherProfile(), { wrapper: createWrapper() });
    const dto = { vehicleType: "bike", licensePlate: "GR-1234-22", licenseNumber: "DL-001" };
    await result.current.mutateAsync(dto);
    expect(dispatcherApi.createProfile).toHaveBeenCalledWith(dto);
  });
});

describe("useUpdateDispatcherProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("patches the profile and writes the result into the profile cache", async () => {
    const saved = { id: "d1", vehicleType: "car", plateNumber: "GR-55-24" };
    (dispatcherApi.updateProfile as jest.Mock).mockResolvedValue({ data: saved });
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useUpdateDispatcherProfile(), { wrapper });
    await result.current.mutateAsync({ vehicleType: "car" });

    expect(dispatcherApi.updateProfile).toHaveBeenCalledWith({ vehicleType: "car" });
    expect(queryClient.getQueryData(DISPATCHER_KEYS.profile)).toEqual(saved);
  });
});

describe("useSetDispatcherStatus", () => {
  beforeEach(() => jest.clearAllMocks());

  const setup = () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
    return { queryClient, wrapper };
  };

  it("saves the status and writes the returned profile into the cache", async () => {
    const saved = { id: "d1", status: "ONLINE" };
    (dispatcherApi.updateStatus as jest.Mock).mockResolvedValue({ data: saved });
    const { queryClient, wrapper } = setup();

    const { result } = renderHook(() => useSetDispatcherStatus(), { wrapper });
    await result.current.mutateAsync("ONLINE");

    expect(dispatcherApi.updateStatus).toHaveBeenCalledWith("ONLINE");
    expect(queryClient.getQueryData(DISPATCHER_KEYS.profile)).toEqual(saved);
  });

  it("leaves the cached status untouched when the save fails", async () => {
    (dispatcherApi.updateStatus as jest.Mock).mockRejectedValue(new Error("network"));
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(DISPATCHER_KEYS.profile, { id: "d1", status: "OFFLINE" });

    const { result } = renderHook(() => useSetDispatcherStatus(), { wrapper });
    await expect(result.current.mutateAsync("ONLINE")).rejects.toThrow("network");

    expect(queryClient.getQueryData(DISPATCHER_KEYS.profile)).toEqual({
      id: "d1",
      status: "OFFLINE",
    });
  });
});

describe("useAvailableTasks", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch available tasks when online", async () => {
    (dispatcherApi.getAvailableTasks as jest.Mock).mockResolvedValue({
      data: { jobs: [{ id: "t1" }], meta: { total: 1 } },
    });
    const { result } = renderHook(() => useAvailableTasks(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ jobs: [{ id: "t1" }], meta: { total: 1 } });
  });

  it("should not fetch when offline", async () => {
    renderHook(() => useAvailableTasks(false), { wrapper: createWrapper() });
    expect(dispatcherApi.getAvailableTasks).not.toHaveBeenCalled();
  });
});

describe("useMyTasks", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch active tasks", async () => {
    (dispatcherApi.getMyTasks as jest.Mock).mockResolvedValue({
      data: [{ id: "t1", status: "active" }],
    });
    const { result } = renderHook(() => useMyTasks("active"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(dispatcherApi.getMyTasks).toHaveBeenCalledWith("active");
    expect(result.current.data).toEqual([{ id: "t1", status: "active" }]);
  });

  it("should fetch completed tasks", async () => {
    (dispatcherApi.getMyTasks as jest.Mock).mockResolvedValue({
      data: [{ id: "t2", status: "completed" }],
    });
    const { result } = renderHook(() => useMyTasks("completed"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(dispatcherApi.getMyTasks).toHaveBeenCalledWith("completed");
    expect(result.current.data).toEqual([{ id: "t2", status: "completed" }]);
  });
});
