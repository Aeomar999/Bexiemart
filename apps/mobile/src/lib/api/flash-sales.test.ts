jest.mock("./client", () => ({
  apiClient: { get: jest.fn() },
}));

import { flashSalesApi } from "./flash-sales";
import { apiClient } from "./client";

describe("flashSalesApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get active flash sales", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "flash-1", discount: 50 }] } });
    const result = await flashSalesApi.getActive();
    expect(apiClient.get).toHaveBeenCalledWith("/flash-sales/active");
    expect(result.data.data).toHaveLength(1);
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(flashSalesApi.getActive()).rejects.toThrow("Network error");
  });
});
