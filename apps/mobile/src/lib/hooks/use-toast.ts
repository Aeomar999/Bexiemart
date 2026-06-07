import { usePopupStore, PopupType } from "../stores/popup-store";

interface ToastOptions {
  type: PopupType;
  title: string;
  message?: string;
}

export function useToast() {
  const { showPopup, hidePopup } = usePopupStore();

  const show = (opts: ToastOptions) => {
    showPopup({
      type: opts.type,
      title: opts.title,
      message: opts.message || "",
    });
  };

  return { show, hide: hidePopup };
}
