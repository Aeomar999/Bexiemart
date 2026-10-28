import { apiClient } from "./client";
import { bannersApi } from "./banners";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("banners API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("list", () => {
    it("should list banners", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await bannersApi.list();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/banners", {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("create", () => {
    it("should create a banner", async () => {
      const mockData = { id: "b1", title: "Spring Sale" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await bannersApi.create({
        title: "Spring Sale",
        imageUrl: "https://example.com/banner.jpg",
        linkUrl: "/shop",
        placement: "HOME",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/admin/banners", {
        title: "Spring Sale",
        imageUrl: "https://example.com/banner.jpg",
        linkUrl: "/shop",
        placement: "HOME",
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("update", () => {
    it("should update a banner", async () => {
      const mockData = { id: "b1", title: "Updated Sale" };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await bannersApi.update("b1", { title: "Updated Sale" });

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/banners/b1", {
        title: "Updated Sale",
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("remove", () => {
    it("should remove a banner", async () => {
      const mockData = { success: true };
      (apiClient.delete as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await bannersApi.remove("b1");

      expect(apiClient.delete).toHaveBeenCalledWith("/admin/banners/b1");
      expect(result).toEqual(mockData);
    });
  });
});
