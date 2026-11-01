import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { env } from "@/lib/env";
import { notify } from "@/lib/notify";

const POLICY_VIOLATION_CLOSE_CODE = 1008;

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;

interface SocketMessage {
  event: string;
  data: unknown;
}

const isSocketMessage = (value: unknown): value is SocketMessage =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { event?: unknown }).event === "string";

const buildSocketUrl = (path: string, ticket: string): string => {
  const url = new URL(path, env.VITE_API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.href;
};

interface TicketedSocketOptions {
  key: string | null;
  path: string;
  getTicket: () => Promise<string>;
  onMessage: (event: string, data: unknown) => void;
  onReconnected?: () => void;
  notifyOutages?: boolean;
}

export const useTicketedSocket = ({
  key,
  path,
  getTicket,
  onMessage,
  onReconnected,
  notifyOutages = false,
}: TicketedSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef({ getTicket, onMessage, onReconnected });

  useLayoutEffect(() => {
    callbacksRef.current = { getTicket, onMessage, onReconnected };
  });

  useEffect(() => {
    if (key === null) return;

    let wasStopped = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectAttempt = 0;
    let hasConnectedOnce = false;
    let isOutageNotified = false;

    const scheduleReconnect = () => {
      const delay = Math.min(
        RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt,
        RECONNECT_MAX_DELAY_MS,
      );
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => void connect(), delay);
    };

    const handleOpen = () => {
      const missedUpdates = hasConnectedOnce || reconnectAttempt > 0;
      reconnectAttempt = 0;
      hasConnectedOnce = true;
      setIsConnected(true);
      if (missedUpdates) callbacksRef.current.onReconnected?.();
      if (isOutageNotified) {
        notify("Live updates restored", "info");
        isOutageNotified = false;
      }
    };

    const handleMessage = (messageEvent: MessageEvent<string>) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(messageEvent.data);
      } catch (error) {
        console.error(`Failed to parse ${path} socket message`, error);
        return;
      }
      if (!isSocketMessage(parsed)) {
        console.error(`Unexpected ${path} socket message shape`, parsed);
        return;
      }
      callbacksRef.current.onMessage(parsed.event, parsed.data);
    };

    const handleError = () => {
      console.error(`${path} socket error`);
    };

    const handleConnectionLost = () => {
      setIsConnected(false);
      if (notifyOutages && !isOutageNotified) {
        notify(
          hasConnectedOnce
            ? "Live updates disconnected, reconnecting…"
            : "Live updates are unavailable, reconnecting…",
          "error",
        );
        isOutageNotified = true;
      }
      scheduleReconnect();
    };

    const handleClose = (closeEvent: CloseEvent) => {
      if (wasStopped) return;
      if (closeEvent.code === POLICY_VIOLATION_CLOSE_CODE) {
        setIsConnected(false);
        return;
      }
      handleConnectionLost();
    };

    const connect = async () => {
      let ticket: string;
      try {
        ticket = await callbacksRef.current.getTicket();
      } catch {
        if (!wasStopped) handleConnectionLost();
        return;
      }
      if (wasStopped) return;

      socket = new WebSocket(buildSocketUrl(path, ticket));
      socket.addEventListener("open", handleOpen);
      socket.addEventListener("message", handleMessage);
      socket.addEventListener("error", handleError);
      socket.addEventListener("close", handleClose);
    };

    void connect();

    return () => {
      wasStopped = true;
      clearTimeout(reconnectTimer);
      socket?.close();
      setIsConnected(false);
    };
  }, [key, path, notifyOutages]);

  return { isConnected };
};
