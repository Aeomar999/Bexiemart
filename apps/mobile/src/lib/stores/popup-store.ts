import { create } from "zustand";

export type PopupType = "success" | "error" | "info";

export interface PopupAction {
  label: string;
  onPress: () => void;
}

export interface PopupState {
  isVisible: boolean;
  type: PopupType;
  title: string;
  message: string;
  action?: PopupAction;

  showPopup: (params: {
    type: PopupType;
    title: string;
    message: string;
    action?: PopupAction;
  }) => void;
  hidePopup: () => void;
}

export const usePopupStore = create<PopupState>()((set) => ({
  isVisible: false,
  type: "success",
  title: "",
  message: "",
  action: undefined,

  showPopup: ({ type, title, message, action }) => {
    set({ isVisible: true, type, title, message, action });
  },

  hidePopup: () => {
    set({ isVisible: false, action: undefined });
  },
}));
