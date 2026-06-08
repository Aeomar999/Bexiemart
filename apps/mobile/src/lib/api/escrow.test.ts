jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { escrowApi } from "./escrow";
import { apiClient } from "./client";

describe("escrowApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should list escrow", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "esc-1" }] } });
    const result = await escrowApi.list();
    expect(apiClient.get).toHaveBeenCalledWith("/escrow");
    expect(result.data.data).toHaveLength(1);
  });

  it("should get single escrow", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "esc-1", status: "held" } });
    const result = await escrowApi.get("esc-1");
    expect(apiClient.get).toHaveBeenCalledWith("/escrow/esc-1");
    expect(result.data.status).toBe("held");
  });

  it("should dispute escrow", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { status: "disputed" } });
    const result = await escrowApi.dispute("esc-1", "Item not received");
    expect(apiClient.post).toHaveBeenCalledWith("/escrow/esc-1/dispute", { reason: "Item not received" });
    expect(result.data.status).toBe("disputed");
  });

  it("should release escrow", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { status: "released" } });
    const result = await escrowApi.release("esc-1");
    expect(apiClient.post).toHaveBeenCalledWith("/escrow/esc-1/release");
    expect(result.data.status).toBe("released");
  });
});
