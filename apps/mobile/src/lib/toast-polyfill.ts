import { usePopupStore, PopupType } from './stores/popup-store';

export const Toast = {
  show: (options: { type?: string; text1?: string; text2?: string }) => {
    // Map the standard toast options to our global popup store
    let type: PopupType = 'info';
    
    if (options.type === 'success' || options.type === 'error' || options.type === 'info') {
      type = options.type;
    }

    usePopupStore.getState().showPopup({
      type,
      title: options.text1 || 'Notification',
      message: options.text2 || '',
    });
  },
  
  hide: () => {
    usePopupStore.getState().hidePopup();
  }
};

export default Toast;
