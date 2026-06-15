import { useEffect, useState } from "react";
import { getSocket, connectSocket, disconnectSocket } from "../socket";
import { useAuthStore } from "../stores/auth-store";

export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();
    
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    connectSocket();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [isAuthenticated]);

  return isConnected;
}

export function useSocketEvent<T>(eventName: string, callback: (data: T) => void) {
  useEffect(() => {
    const socket = getSocket();
    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [eventName, callback]);
}
