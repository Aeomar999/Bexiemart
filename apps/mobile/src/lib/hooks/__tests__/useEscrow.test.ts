import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/escrow", () => ({
  escrowApi: {
    list: jest.fn(),
    get: jest.fn(),
    release: jest.fn(),
    refund: jest.fn(),
    dispute: jest.fn(),
  },
}));

import {
  useEscrows,
  useEscrow,
  useReleaseEscrow,
  useRefundEscrow,
  useDisputeEscrow,
} from "../use-escrow";
import { escrowApi } from "../../api/escrow";
import { createWrapper } from "./test-utils";

describe("useEscrow Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useEscrows", () => {
    it("should fetch escrows", async () => {
      (escrowApi.list as jest.Mock).mockResolvedValue({ data: [{ id: "1", amount: 100 }] });
      const { result } = renderHook(() => useEscrows(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([{ id: "1", amount: 100 }]);
    });
  });

  describe("useEscrow", () => {
    it("should fetch escrow by id", async () => {
      (escrowApi.get as jest.Mock).mockResolvedValue({ data: { id: "1", amount: 100 } });
      const { result } = renderHook(() => useEscrow("1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({ id: "1", amount: 100 });
      expect(escrowApi.get).toHaveBeenCalledWith("1");
    });

    it("should not fetch if id is empty", () => {
      renderHook(() => useEscrow(""), { wrapper: createWrapper() });
      expect(escrowApi.get).not.toHaveBeenCalled();
    });
  });

  describe("useReleaseEscrow", () => {
    it("should call release api", async () => {
      (escrowApi.release as jest.Mock).mockResolvedValue({ data: { success: true } });
      const { result } = renderHook(() => useReleaseEscrow(), { wrapper: createWrapper() });
      await result.current.mutateAsync("1");
      expect(escrowApi.release).toHaveBeenCalledWith("1");
    });
  });

  describe("useRefundEscrow", () => {
    it("should call refund api", async () => {
      (escrowApi.refund as jest.Mock).mockResolvedValue({ data: { success: true } });
      const { result } = renderHook(() => useRefundEscrow(), { wrapper: createWrapper() });
      await result.current.mutateAsync("1");
      expect(escrowApi.refund).toHaveBeenCalledWith("1");
    });
  });

  describe("useDisputeEscrow", () => {
    it("should call dispute api", async () => {
      (escrowApi.dispute as jest.Mock).mockResolvedValue({ data: { success: true } });
      const { result } = renderHook(() => useDisputeEscrow(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ id: "1", reason: "defective" });
      expect(escrowApi.dispute).toHaveBeenCalledWith("1", "defective");
    });
  });
});
