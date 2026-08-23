import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSignalR } from '@/features/testRuns/useSignalR';

const mockConnection = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  onreconnected: vi.fn(),
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: class {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    build() {
      return mockConnection;
    }
  },
}));

vi.mock('@/auth/keycloak', () => ({
  default: { token: 'test-token' },
}));

vi.mock('@/lib/env', () => ({
  env: { VITE_API_URL: 'http://localhost:5000' },
}));

beforeEach(() => {
  mockConnection.on.mockClear();
  mockConnection.off.mockClear();
  mockConnection.onreconnected.mockClear();
  mockConnection.start.mockClear().mockResolvedValue(undefined);
  mockConnection.stop.mockClear().mockResolvedValue(undefined);
  mockConnection.invoke.mockClear().mockResolvedValue(undefined);
});

describe('useSignalR', () => {
  describe('given no runId — does not connect', () => {
    it('does not start a connection', () => {
      renderHook(() => useSignalR(undefined, {}));

      expect(mockConnection.start).not.toHaveBeenCalled();
    });
  });

  describe('given a runId — starts the connection and joins the run', () => {
    it('starts the hub connection', async () => {
      const { unmount } = renderHook(() => useSignalR('run-1', {}));

      await act(async () => {});

      expect(mockConnection.start).toHaveBeenCalledOnce();
      unmount();
    });

    it('invokes JoinRun with the runId', async () => {
      const { unmount } = renderHook(() => useSignalR('run-1', {}));

      await act(async () => {});

      expect(mockConnection.invoke).toHaveBeenCalledWith('JoinRun', 'run-1');
      unmount();
    });
  });

  describe('given handlers — registers them on the connection', () => {
    it('registers each handler by event name', () => {
      const handler = vi.fn();

      renderHook(() => useSignalR('run-1', { ResultAdded: handler }));

      expect(mockConnection.on).toHaveBeenCalledWith(
        'ResultAdded',
        expect.any(Function),
      );
    });

    it('calls the registered callback when the event fires', async () => {
      const handler = vi.fn();

      renderHook(() => useSignalR('run-1', { ResultAdded: handler }));

      await act(async () => {});

      const [, registeredFn] = mockConnection.on.mock.calls.find(
        ([event]) => event === 'ResultAdded',
      )!;

      registeredFn(undefined);

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('given updated handlers — always calls the latest version', () => {
    it('invokes the new handler after a rerender, not the stale one', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const { rerender } = renderHook(
        ({ handler }) => useSignalR('run-1', { ResultAdded: handler }),
        { initialProps: { handler: handler1 } },
      );

      await act(async () => {});

      const [, registeredFn] = mockConnection.on.mock.calls.find(
        ([event]) => event === 'ResultAdded',
      )!;

      rerender({ handler: handler2 });
      registeredFn(undefined);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });
  });

  describe('given a new event name added after mount — subscribes to it too', () => {
    it('registers the newly added handler on the existing connection', async () => {
      const resultAdded = vi.fn();
      const runCompleted = vi.fn();

      const initialHandlers: Record<string, (data: unknown) => void> = {
        ResultAdded: resultAdded,
      };
      const { rerender } = renderHook(
        ({ handlers }) => useSignalR('run-1', handlers),
        { initialProps: { handlers: initialHandlers } },
      );

      await act(async () => {});

      expect(mockConnection.on).not.toHaveBeenCalledWith(
        'RunCompleted',
        expect.any(Function),
      );

      rerender({
        handlers: { ResultAdded: resultAdded, RunCompleted: runCompleted },
      });

      expect(mockConnection.on).toHaveBeenCalledWith(
        'RunCompleted',
        expect.any(Function),
      );

      const [, registeredFn] = mockConnection.on.mock.calls.find(
        ([event]) => event === 'RunCompleted',
      )!;
      registeredFn(undefined);

      expect(runCompleted).toHaveBeenCalledOnce();
    });
  });

  describe('on reconnect — rejoins the run and notifies the caller', () => {
    it('invokes JoinRun again and calls onReconnected', async () => {
      const onReconnected = vi.fn();

      renderHook(() => useSignalR('run-1', {}, onReconnected));

      await act(async () => {});
      mockConnection.invoke.mockClear();

      const [reconnectedCallback] = mockConnection.onreconnected.mock.calls[0]!;
      await act(async () => {
        await reconnectedCallback();
      });

      expect(mockConnection.invoke).toHaveBeenCalledWith('JoinRun', 'run-1');
      expect(onReconnected).toHaveBeenCalledOnce();
    });
  });

  describe('on unmount — leaves the run and stops the connection', () => {
    it('invokes LeaveRun', async () => {
      const { unmount } = renderHook(() => useSignalR('run-1', {}));

      await act(async () => {});
      unmount();
      await act(async () => {});

      expect(mockConnection.invoke).toHaveBeenCalledWith('LeaveRun', 'run-1');
    });

    it('stops the connection', async () => {
      const { unmount } = renderHook(() => useSignalR('run-1', {}));

      await act(async () => {});
      unmount();
      await act(async () => {});

      expect(mockConnection.stop).toHaveBeenCalledOnce();
    });
  });
});
