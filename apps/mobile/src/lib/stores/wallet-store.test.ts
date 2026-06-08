jest.mock("../api/wallet", () => ({
  walletApi: {
    getWallet: jest.fn(),
    getTransactions: jest.fn(),
    initializeTopUp: jest.fn(),
    transfer: jest.fn(),
  },
}));
jest.mock("../logger", () => ({ logger: { error: jest.fn() } }));

import { useWalletStore } from "./wallet-store";
import { walletApi } from "../api/wallet";

const mockWallet = { data: { balance: "500", currency: "GHS", user: { name: "John" }, id: "w1", bexieCoins: 100 } };
const mockTransactions = { data: [{ id: "t1", type: "DEPOSIT", amount: 500, description: "Top up", date: "2025-01-01", status: "COMPLETED" }] };

describe("Wallet Store", () => {
  beforeEach(() => {
    useWalletStore.setState({ balance: 0, currency: "GHS", accountName: "", accountNumber: "", bexieCoins: 0, transactions: [], isLoading: false });
    jest.clearAllMocks();
  });

  it("should fetch wallet and update state", async () => {
    (walletApi.getWallet as jest.Mock).mockResolvedValue(mockWallet);
    (walletApi.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);
    await useWalletStore.getState().fetchWallet();
    const state = useWalletStore.getState();
    expect(state.balance).toBe(500);
    expect(state.currency).toBe("GHS");
    expect(state.accountName).toBe("John");
    expect(state.bexieCoins).toBe(100);
    expect(state.isLoading).toBe(false);
  });

  it("should handle fetch wallet error", async () => {
    (walletApi.getWallet as jest.Mock).mockRejectedValue(new Error("network"));
    await useWalletStore.getState().fetchWallet();
    expect(useWalletStore.getState().isLoading).toBe(false);
    expect(useWalletStore.getState().balance).toBe(0);
  });

  it("should fetch transactions", async () => {
    (walletApi.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);
    await useWalletStore.getState().fetchTransactions();
    expect(useWalletStore.getState().transactions).toHaveLength(1);
    expect(useWalletStore.getState().transactions[0].type).toBe("DEPOSIT");
  });

  it("should top up and refresh wallet", async () => {
    (walletApi.initializeTopUp as jest.Mock).mockResolvedValue({});
    (walletApi.getWallet as jest.Mock).mockResolvedValue(mockWallet);
    (walletApi.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);
    await useWalletStore.getState().topUp(100, "mtn");
    expect(walletApi.initializeTopUp).toHaveBeenCalledWith(100, "mtn");
  });

  it("should throw on top up error", async () => {
    (walletApi.initializeTopUp as jest.Mock).mockRejectedValue(new Error("failed"));
    await expect(useWalletStore.getState().topUp(100, "mtn")).rejects.toThrow("failed");
  });

  it("should add transaction optimistically", () => {
    useWalletStore.getState().addTransaction({ type: "ORDER_PAYMENT", amount: 50, description: "Order #1", status: "COMPLETED" });
    expect(useWalletStore.getState().transactions).toHaveLength(1);
    expect(useWalletStore.getState().transactions[0].type).toBe("ORDER_PAYMENT");
  });

  it("should spend bexie coins without going negative", () => {
    useWalletStore.setState({ bexieCoins: 100 });
    useWalletStore.getState().spendBexieCoins(30);
    expect(useWalletStore.getState().bexieCoins).toBe(70);
    useWalletStore.getState().spendBexieCoins(200);
    expect(useWalletStore.getState().bexieCoins).toBe(0);
  });

  it("should send money and refresh", async () => {
    (walletApi.transfer as jest.Mock).mockResolvedValue({});
    (walletApi.getWallet as jest.Mock).mockResolvedValue(mockWallet);
    (walletApi.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);
    await useWalletStore.getState().sendMoney(100, "recip@test.com", "1234");
    expect(walletApi.transfer).toHaveBeenCalledWith("recip@test.com", 100, "1234");
  });

  it("should throw on send money error", async () => {
    (walletApi.transfer as jest.Mock).mockRejectedValue(new Error("insufficient"));
    await expect(useWalletStore.getState().sendMoney(100, "x", "0000")).rejects.toThrow("insufficient");
  });
});
