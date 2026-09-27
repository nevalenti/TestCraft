import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { useEffect, useLayoutEffect, useRef } from 'react';

import keycloak from '@/auth/keycloak';
import { env } from '@/lib/env';
import { notify } from '@/lib/notify';

interface CancellationState {
  wasCancelled: boolean;
}

const startConnection = async (
  connection: HubConnection,
  runId: string,
  state: CancellationState,
) => {
  try {
    await connection.start();
    if (state.wasCancelled) return;
    await connection.invoke('JoinRun', runId);
  } catch (error) {
    // A deliberate unmount aborts the in-flight start via cleanup's
    // connection.stop() below, which rejects the same way a real connection
    // failure would — don't surface an error toast for that.
    if (state.wasCancelled) return;
    console.error(error);
    notify(
      'Live updates are unavailable — refresh the page to retry.',
      'error',
    );
  }
};

const stopConnection = async (
  connection: HubConnection,
  runId: string,
  startPromise: Promise<void>,
) => {
  // Wait for the in-flight start to settle before stopping — calling stop()
  // while start() is still negotiating throws "the connection was stopped
  // during negotiation" instead of cleanly tearing down.
  try {
    await startPromise;
  } catch {
    // already surfaced (or suppressed) by startConnection above
  }
  try {
    await connection.invoke('LeaveRun', runId);
  } catch (error) {
    console.debug('Failed to leave SignalR run group during cleanup', error);
  }
  try {
    await connection.stop();
  } catch (error) {
    console.debug('Failed to stop SignalR connection during cleanup', error);
  }
};

export const useSignalR = (
  runId: string | undefined,
  handlers: Record<string, (data: unknown) => void>,
  onReconnected?: () => void,
) => {
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
          notify(
            'Live updates reconnected but failed to resume — refresh to catch up.',
            'error',
          );
        }
      })();
    });

    connection.onreconnecting(() => {
      notify('Live updates disconnected, reconnecting…', 'error');
    });

    const cancellationState: CancellationState = { wasCancelled: false };
    const startPromise = startConnection(connection, runId, cancellationState);

    return () => {
      cancellationState.wasCancelled = true;
      connectionRef.current = null;
      void stopConnection(connection, runId, startPromise);
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
};
