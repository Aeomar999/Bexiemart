import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/wallet", () => ({
  walletApi: {
    getWallet: jest.fn(),
    getTransactions: jest.fn(),
    initializeTopUp: jest.fn(),
    transfer: jest.fn(),
    getPinStatus: jest.fn(),
    setPin: jest.fn(),
    changePin: jest.fn(),
    verifyPin: jest.fn(),
    resetPinFailures: jest.fn(),
    getCards: jest.fn(),
    addCard: jest.fn(),
    verifyAndSaveCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
    setDefaultCard: jest.fn(),
    getBankAccounts: jest.fn(),
    linkBankAccount: jest.fn(),
    deleteBankAccount: jest.fn(),
    getMomoAccounts: jest.fn(),
    linkMomoAccount: jest.fn(),
    deleteMomoAccount: jest.fn(),
  },
}));;

import { useWallet, useTransactions, useTopUp, useTransfer, usePinStatus, useCards, useBankAccounts, useMomoAccounts } from "../use-wallet";
import { walletApi } from "../../api/wallet";
import { createWrapper } from "./test-utils";

describe("useWallet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch wallet balance on mount", async () => {
    (walletApi.getWallet as jest.Mock).mockResolvedValue({ data: { balance: 5000 } });
    const { result } = renderHook(() => useWallet(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return wallet data on success", async () => {
    (walletApi.getWallet as jest.Mock).mockResolvedValue({ data: { balance: 5000, currency: "NGN" } });
    const { result} = renderHook(() => useWallet(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ balance: 5000, currency: "NGN" });
  });

  it("should handle fetch error", async () => {
    (walletApi.getWallet as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useWallet(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useTransactions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch transactions list", async () => {
    (walletApi.getTransactions as jest.Mock).mockResolvedValue({ data: [{ id: "t1", amount: 1000, type: "credit" }] });
    const { result} = renderHook(() => useTransactions(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(walletApi.getTransactions).toHaveBeenCalledWith(1);
    expect(result.current.data).toEqual([{ id: "t1", amount: 1000, type: "credit" }]);
  });

  it("should handle empty transactions", async () => {
    (walletApi.getTransactions as jest.Mock).mockResolvedValue({ data: [] });
    const { result} = renderHook(() => useTransactions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });
});

describe("useTopUp", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call initializeTopUp with amount and channel", async () => {
    (walletApi.initializeTopUp as jest.Mock).mockResolvedValue({ data: { reference: "ref123", url: "https://pay.com" } });
    const { result} = renderHook(() => useTopUp(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ amount: 2000, channel: "card" });
    expect(walletApi.initializeTopUp).toHaveBeenCalledWith(2000, "card");
  });

  it("should handle deposit error", async () => {
    (walletApi.initializeTopUp as jest.Mock).mockRejectedValue(new Error("Payment failed"));
    const { result} = renderHook(() => useTopUp(), { wrapper: createWrapper() });
    result.current.mutate({ amount: 2000, channel: "card" });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useTransfer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call transfer with email, amount and pin", async () => {
    (walletApi.transfer as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useTransfer(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ email: "user@test.com", amount: 1000, pin: "1234" });
    expect(walletApi.transfer).toHaveBeenCalledWith("user@test.com", 1000, "1234");
  });
});
