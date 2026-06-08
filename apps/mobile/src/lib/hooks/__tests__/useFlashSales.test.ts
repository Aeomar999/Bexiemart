import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/flash-sales", () => ({
  flashSalesApi: {
    getActive: jest.fn(),
  },
}));;

import { useActiveFlashSales } from "../use-flash-sales";
import { flashSalesApi } from "../../api/flash-sales";
import { createWrapper } from "./test-utils";

describe("useActiveFlashSales", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch active flash sales on mount", async () => {
    (flashSalesApi.getActive as jest.Mock).mockResolvedValue({ data: [{ id: "fs1", discount: 50 }] });
    const { result } = renderHook(() => useActiveFlashSales(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return flash sales on success", async () => {
    (flashSalesApi.getActive as jest.Mock).mockResolvedValue({ data: [{ id: "fs1", title: "Flash Deal", discount: 50 }] });
    const { result} = renderHook(() => useActiveFlashSales(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "fs1", title: "Flash Deal", discount: 50 }]);
  });

  it("should handle empty flash sales", async () => {
    (flashSalesApi.getActive as jest.Mock).mockResolvedValue({ data: [] });
    const { result} = renderHook(() => useActiveFlashSales(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (flashSalesApi.getActive as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useActiveFlashSales(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});
