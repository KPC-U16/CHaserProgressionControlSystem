"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from 'next/navigation';

// WebSocketのContextを作成
const WebSocketContext = createContext<Socket | null>(null);

export const useWebSocket = () => useContext(WebSocketContext);

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    // サーバーURLは適宜変更してください
    const s = io(process.env.NEXT_PUBLIC_WEBSOCK_SERVER);
    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("WebSocket connected:", s.id);
    });
    s.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    s.on("change-screen", (screen) => {
      console.log("Change screen to:", screen);
      // ここで画面遷移のロジックを実装 (nextjsのrouterなどを使用)
      router.push(`/display/${screen}`);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
}