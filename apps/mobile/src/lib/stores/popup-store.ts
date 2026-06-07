import { create } from "zustand";

export type PopupType = "success" | "error" | "info";

export interface PopupState {
  isVisible: boolean;
  type: PopupType;
  title: string;
  message: string;

  showPopup: (params: { type: PopupType; title: string; message: string }) => void;
  hidePopup: () => void;
}

export const usePopupStore = create<PopupState>()((set) => ({
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
}));
