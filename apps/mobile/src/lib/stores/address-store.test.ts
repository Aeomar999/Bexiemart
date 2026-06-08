jest.mock("../api/addresses", () => ({
  addressesApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
  },
}));
jest.mock("../logger", () => ({ logger: { error: jest.fn() } }));

import { useAddressStore } from "./address-store";
import { addressesApi } from "../api/addresses";

const mockAddresses = {
  data: [
    { id: "a1", type: "Home", name: "Home", address: "123 St", city: "Accra", phone: "0241234567", isDefault: true },
    { id: "a2", type: "Office", name: "Work", address: "456 Ave", city: "Accra", phone: "0247654321", isDefault: false },
  ],
};

describe("Address Store", () => {
  beforeEach(() => {
    useAddressStore.setState({ addresses: [], isLoading: false });
    jest.clearAllMocks();
  });

  it("should fetch addresses", async () => {
    (addressesApi.getAll as jest.Mock).mockResolvedValue(mockAddresses);
    await useAddressStore.getState().fetchAddresses();
    const state = useAddressStore.getState();
    expect(state.addresses).toHaveLength(2);
    expect(state.isLoading).toBe(false);
  });

  it("should handle fetch error", async () => {
    (addressesApi.getAll as jest.Mock).mockRejectedValue(new Error("network"));
    await useAddressStore.getState().fetchAddresses();
    expect(useAddressStore.getState().isLoading).toBe(false);
    expect(useAddressStore.getState().addresses).toHaveLength(0);
  });

  it("should add address and refresh", async () => {
    (addressesApi.create as jest.Mock).mockResolvedValue({});
    (addressesApi.getAll as jest.Mock).mockResolvedValue(mockAddresses);
    await useAddressStore.getState().addAddress({ type: "Other", name: "Gym", address: "789 Blvd", city: "Kumasi", phone: "0200000000", isDefault: false });
    expect(addressesApi.create).toHaveBeenCalled();
  });

  it("should throw on add error", async () => {
    (addressesApi.create as jest.Mock).mockRejectedValue(new Error("validation"));
    await expect(useAddressStore.getState().addAddress({ type: "Home", name: "X", address: "1 St", city: "Accra", phone: "0240000000", isDefault: false })).rejects.toThrow("validation");
  });

  it("should update address and refresh", async () => {
    (addressesApi.update as jest.Mock).mockResolvedValue({});
    (addressesApi.getAll as jest.Mock).mockResolvedValue(mockAddresses);
    await useAddressStore.getState().updateAddress("a1", { name: "Updated" });
    expect(addressesApi.update).toHaveBeenCalledWith("a1", { name: "Updated" });
  });

  it("should delete address and refresh", async () => {
    (addressesApi.remove as jest.Mock).mockResolvedValue({});
    (addressesApi.getAll as jest.Mock).mockResolvedValue({ data: [mockAddresses.data[1]] });
    await useAddressStore.getState().deleteAddress("a1");
    expect(addressesApi.remove).toHaveBeenCalledWith("a1");
  });

  it("should set default address and refresh", async () => {
    (addressesApi.setDefault as jest.Mock).mockResolvedValue({});
    (addressesApi.getAll as jest.Mock).mockResolvedValue(mockAddresses);
    await useAddressStore.getState().setDefaultAddress("a2");
    expect(addressesApi.setDefault).toHaveBeenCalledWith("a2");
  });
});
