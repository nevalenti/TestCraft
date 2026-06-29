import { HubConnectionBuilder } from "@microsoft/signalr";
import { useEffect, useLayoutEffect, useRef } from "react";

import keycloak from "@/auth/keycloak";
import { env } from "@/lib/env";

export function useSignalR(
  runId: string | undefined,
  handlers: Record<string, (data: unknown) => void>,
) {
  const handlersRef = useRef(handlers);
  const eventNamesRef = useRef(Object.keys(handlers));

  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!runId) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${env.VITE_API_URL}/hubs/test-run`, {
        accessTokenFactory: () => keycloak.token ?? "",
      })
      .withAutomaticReconnect()
      .build();

    for (const event of eventNamesRef.current) {
      connection.on(event, (data) => handlersRef.current[event]?.(data));
    }

    (async () => {
      try {
        await connection.start();
        await connection.invoke("JoinRun", runId);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      (async () => {
        try {
          await connection.invoke("LeaveRun", runId);
        } catch {
          // ignore cleanup errors
        }
        try {
          await connection.stop();
        } catch {
          // ignore cleanup errors
        }
      })();
    };
  }, [runId]);
}
