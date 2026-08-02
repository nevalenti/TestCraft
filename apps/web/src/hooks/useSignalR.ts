import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { useEffect, useLayoutEffect, useRef } from 'react';

import keycloak from '@/auth/keycloak';
import { env } from '@/lib/env';

export function useSignalR(
  runId: string | undefined,
  handlers: Record<string, (data: unknown) => void>,
  onReconnected?: () => void,
) {
  const handlersRef = useRef(handlers);
  const onReconnectedRef = useRef(onReconnected);
  const connectionRef = useRef<HubConnection | null>(null);

  useLayoutEffect(() => {
    handlersRef.current = handlers;
    onReconnectedRef.current = onReconnected;
  });

  const eventNamesKey = Object.keys(handlers)
    .toSorted((a, b) => a.localeCompare(b))
    .join(',');

  useEffect(() => {
    if (!runId) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${env.VITE_API_URL}/hubs/test-run`, {
        accessTokenFactory: () => keycloak.token ?? '',
      })
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    connection.onreconnected(() => {
      (async () => {
        try {
          await connection.invoke('JoinRun', runId);
          onReconnectedRef.current?.();
        } catch (error) {
          console.error(error);
        }
      })();
    });

    (async () => {
      try {
        await connection.start();
        await connection.invoke('JoinRun', runId);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      connectionRef.current = null;
      (async () => {
        try {
          await connection.invoke('LeaveRun', runId);
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

  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection) return;

    const eventNames = eventNamesKey ? eventNamesKey.split(',') : [];
    for (const event of eventNames) {
      connection.on(event, (data) => handlersRef.current[event]?.(data));
    }

    return () => {
      for (const event of eventNames) {
        connection.off(event);
      }
    };
  }, [runId, eventNamesKey]);
}
