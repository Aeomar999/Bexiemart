import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/dispatcher", () => ({
  dispatcherApi: {
    createProfile: jest.fn(),
    getAvailableTasks: jest.fn(),
    getMyTasks: jest.fn(),
    acceptTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    getEarnings: jest.fn(),
    getTransactions: jest.fn(),
    getAnalytics: jest.fn(),
    withdrawEarnings: jest.fn(),
  },
}));;

import { useCreateDispatcherProfile, useAvailableTasks, useMyTasks, useAcceptTask, useUpdateTaskStatus, useDispatcherEarnings, useDispatcherTransactions, useDispatcherAnalytics, useWithdrawEarnings } from "../use-dispatcher";
import { dispatcherApi } from "../../api/dispatcher";
import { createWrapper } from "./test-utils";

describe("useCreateDispatcherProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create dispatcher profile mutation", async () => {
    (dispatcherApi.createProfile as jest.Mock).mockResolvedValue({ data: { id: "d1", status: "active" } });
    const { result} = renderHook(() => useCreateDispatcherProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ vehicleType: "bike" });
    expect(dispatcherApi.createProfile).toHaveBeenCalledWith({ vehicleType: "bike" });
  });
});

describe("useAvailableTasks", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch available tasks when online", async () => {
    (dispatcherApi.getAvailableTasks as jest.Mock).mockResolvedValue({ data: { rides: [], deliveries: [{ id: "t1" }] } });
    const { result} = renderHook(() => useAvailableTasks(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ rides: [], deliveries: [{ id: "t1" }] });
  });

  it("should not fetch when offline", async () => {
    renderHook(() => useAvailableTasks(false), { wrapper: createWrapper() });
    expect(dispatcherApi.getAvailableTasks).not.toHaveBeenCalled();
  });
});

describe("useMyTasks", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch active tasks", async () => {
    (dispatcherApi.getMyTasks as jest.Mock).mockResolvedValue({ data: [{ id: "t1", status: "active" }] });
    const { result} = renderHook(() => useMyTasks("active"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(dispatcherApi.getMyTasks).toHaveBeenCalledWith("active");
    expect(result.current.data).toEqual([{ id: "t1", status: "active" }]);
  });

  it("should fetch completed tasks", async () => {
    (dispatcherApi.getMyTasks as jest.Mock).mockResolvedValue({ data: [{ id: "t2", status: "completed" }] });
    const { result} = renderHook(() => useMyTasks("completed"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(dispatcherApi.getMyTasks).toHaveBeenCalledWith("completed");
    expect(result.current.data).toEqual([{ id: "t2", status: "completed" }]);
  });
});
