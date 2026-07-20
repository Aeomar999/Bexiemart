import { useEffect, useState } from "react";
import { getSocket, connectSocket, disconnectSocket } from "../socket";
import { useAuthStore } from "../stores/auth-store";
import { Socket } from "socket.io-client";

export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    let mounted = true;
    let socketInstance: Socket | null = null;

    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const onConnect = () => {
      if (mounted) setIsConnected(true);
    };
    const onDisconnect = () => {
      if (mounted) setIsConnected(false);
    };

    getSocket()
      .then((socket) => {
        if (!mounted) return;
        socketInstance = socket;
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        if (socket.connected) {
          setIsConnected(true);
        }
        connectSocket();
      })
      .catch((err) => {
        console.error("Failed to connect socket:", err);
      });

    return () => {
      mounted = false;
      if (socketInstance) {
        socketInstance.off("connect", onConnect);
        socketInstance.off("disconnect", onDisconnect);
      }
    };
  }, [isAuthenticated]);

  return isConnected;
}

export function useSocketEvent<T>(eventName: string, callback: (data: T) => void) {
  useEffect(() => {
    let mounted = true;
    let socketInstance: Socket | null = null;

    getSocket()
      .then((socket) => {
        if (!mounted) return;
        socketInstance = socket;
        socket.on(eventName, callback);
      })
      .catch((err) => {
        console.warn("Failed to connect socket:", err);
      });

    return () => {
      mounted = false;
      if (socketInstance) {
        socketInstance.off(eventName, callback);
      }
    };
  }, [eventName, callback]);
}
