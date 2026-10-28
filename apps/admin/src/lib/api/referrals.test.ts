import { apiClient } from "./client";
import { referralsApi } from "./referrals";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe("referrals API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getReferrals", () => {
    it("should list referrals", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await referralsApi.getReferrals();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/referrals", {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });
});
