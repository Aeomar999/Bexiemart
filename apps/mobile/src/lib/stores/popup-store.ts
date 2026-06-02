import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PopupType = "success" | "error" | "info";

export interface PopupState {
  isVisible: boolean;
  type: PopupType;
  title: string;
  message: string;

  showPopup: (params: { type: PopupType; title: string; message: string }) => void;
  hidePopup: () => void;
}

export const usePopupStore = create<PopupState>()(
  persist(
    (set) => ({
      isVisible: false,
      type: "success",
      title: "",
      message: "",

      showPopup: ({ type, title, message }) => {
        set({ isVisible: true, type, title, message });
      },

      hidePopup: () => {
        set({ isVisible: false });
      },
    }),
    {
      name: "popup-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
