import { create } from "zustand";
import { addressesApi } from "../api/addresses";

export interface Address {
  id: string;
  type: string; // 'Home', 'Office', 'Other'
  name: string;
  address: string;
  city: string;
  phone: string;
  isDefault: boolean;
}

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,

  fetchAddresses: async () => {
    try {
      set({ isLoading: true });
      const response = await addressesApi.getAll();
      set({ addresses: response.data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      set({ isLoading: false });
    }
  },

  addAddress: async (newAddressData) => {
    try {
      await addressesApi.create(newAddressData);
      await get().fetchAddresses();
    } catch (error) {
      console.error("Failed to add address:", error);
      throw error;
    }
  },

  updateAddress: async (id, updatedData) => {
    try {
      await addressesApi.update(id, updatedData);
      await get().fetchAddresses();
    } catch (error) {
      console.error("Failed to update address:", error);
      throw error;
    }
  },

  deleteAddress: async (id) => {
    try {
      await addressesApi.remove(id);
      await get().fetchAddresses();
    } catch (error) {
      console.error("Failed to delete address:", error);
      throw error;
    }
  },

  setDefaultAddress: async (id) => {
    try {
      await addressesApi.setDefault(id);
      await get().fetchAddresses();
    } catch (error) {
      console.error("Failed to set default address:", error);
      throw error;
    }
  },
}));
