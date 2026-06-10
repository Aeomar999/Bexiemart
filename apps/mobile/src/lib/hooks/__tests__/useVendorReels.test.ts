import { renderHook, waitFor } from "@testing-library/react-native";
import { useVendorReels, useCreateReel, useDeleteReel } from "../use-vendor-reels";
import { vendorReelsApi } from "../../api/vendor-reels";
import { createWrapper } from "./test-utils";

jest.mock("../../api/vendor-reels", () => ({
  vendorReelsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  },
}));

describe("useVendorReels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch all vendor reels on mount", async () => {
    (vendorReelsApi.getAll as jest.Mock).mockResolvedValue({
      data: [{ id: "1", videoUrl: "http://test.com/v.mp4" }],
    });

    const { result } = renderHook(() => useVendorReels(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([{ id: "1", videoUrl: "http://test.com/v.mp4" }]);
    expect(vendorReelsApi.getAll).toHaveBeenCalled();
  });
});

describe("useCreateReel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call create api", async () => {
    (vendorReelsApi.create as jest.Mock).mockResolvedValue({ data: { id: "2" } });

    const { result } = renderHook(() => useCreateReel(), { wrapper: createWrapper() });

    result.current.mutate({ videoUrl: "http://test.com/new.mp4" } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(vendorReelsApi.create).toHaveBeenCalledWith({ videoUrl: "http://test.com/new.mp4" });
  });
});

describe("useDeleteReel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call remove api", async () => {
    (vendorReelsApi.remove as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useDeleteReel(), { wrapper: createWrapper() });

    result.current.mutate("1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(vendorReelsApi.remove).toHaveBeenCalledWith("1");
  });
});
