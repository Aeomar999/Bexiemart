jest.mock("../api/customer-payment-methods", () => ({
  customerPaymentMethodsApi: {
    getAll: jest.fn(),
    addCard: jest.fn(),
    addMomo: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
  },
}));
jest.mock("../logger", () => ({ logger: { error: jest.fn() } }));

import { usePaymentStore } from "./payment-store";
import { customerPaymentMethodsApi } from "../api/customer-payment-methods";

const mockMethods = {
  data: [
    { id: "pm1", type: "card", provider: "visa", details: "•••• 4242", holderName: "John", expiry: "12/26", isDefault: true },
    { id: "pm2", type: "momo", provider: "mtn", details: "+233 24 123 4567", holderName: "John", isDefault: false },
  ],
};

describe("Payment Store", () => {
  beforeEach(() => {
    usePaymentStore.setState({ paymentMethods: [], isLoading: false });
    jest.clearAllMocks();
  });

  it("should fetch payment methods", async () => {
    (customerPaymentMethodsApi.getAll as jest.Mock).mockResolvedValue(mockMethods);
    await usePaymentStore.getState().fetchPaymentMethods();
    expect(usePaymentStore.getState().paymentMethods).toHaveLength(2);
    expect(usePaymentStore.getState().isLoading).toBe(false);
  });

  it("should handle fetch error", async () => {
    (customerPaymentMethodsApi.getAll as jest.Mock).mockRejectedValue(new Error("network"));
    await usePaymentStore.getState().fetchPaymentMethods();
    expect(usePaymentStore.getState().isLoading).toBe(false);
  });

  it("should add card method and refresh", async () => {
    (customerPaymentMethodsApi.addCard as jest.Mock).mockResolvedValue({});
    (customerPaymentMethodsApi.getAll as jest.Mock).mockResolvedValue(mockMethods);
    await usePaymentStore.getState().addCardMethod({ provider: "visa", details: "•••• 1111", holderName: "John", expiry: "12/27" });
    expect(customerPaymentMethodsApi.addCard).toHaveBeenCalled();
  });

  it("should add momo method and refresh", async () => {
    (customerPaymentMethodsApi.addMomo as jest.Mock).mockResolvedValue({});
    (customerPaymentMethodsApi.getAll as jest.Mock).mockResolvedValue(mockMethods);
    await usePaymentStore.getState().addMomoMethod({ provider: "telecel", details: "+233 20 000 0000", holderName: "John" });
    expect(customerPaymentMethodsApi.addMomo).toHaveBeenCalled();
  });

  it("should remove payment method and refresh", async () => {
    (customerPaymentMethodsApi.remove as jest.Mock).mockResolvedValue({});
    (customerPaymentMethodsApi.getAll as jest.Mock).mockResolvedValue({ data: [mockMethods.data[1]] });
    await usePaymentStore.getState().removePaymentMethod("pm1");
    expect(customerPaymentMethodsApi.remove).toHaveBeenCalledWith("pm1");
  });

  it("should set default and refresh", async () => {
    (customerPaymentMethodsApi.setDefault as jest.Mock).mockResolvedValue({});
    (customerPaymentMethodsApi.getAll as jest.Mock).mockResolvedValue(mockMethods);
    await usePaymentStore.getState().setDefaultPaymentMethod("pm2");
    expect(customerPaymentMethodsApi.setDefault).toHaveBeenCalledWith("pm2");
  });
});
