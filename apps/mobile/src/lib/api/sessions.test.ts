import { sessionsApi } from "./sessions";
import { apiClient } from "./client";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("sessionsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls GET /auth/list-sessions on list()", async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await sessionsApi.list();
    expect(apiClient.get).toHaveBeenCalledWith("/auth/list-sessions");
  });

  it("calls POST /auth/revoke-session with token on revoke()", async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    await sessionsApi.revoke("token-abc");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/revoke-session", { token: "token-abc" });
  });

  it("calls POST /auth/revoke-other-sessions on revokeOthers()", async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    await sessionsApi.revokeOthers();
    expect(apiClient.post).toHaveBeenCalledWith("/auth/revoke-other-sessions", {});
  });
});
